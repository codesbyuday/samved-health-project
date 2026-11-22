import React, { useState, useMemo } from 'react';
import { useSearch } from '../context/searchcontext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const standardMedCategories = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Injection',
  'Ointment / Cream',
  'Drops (Eye/Ear)',
  'Inhaler / Respules',
  'IV Fluid / Infusion',
  'Powder / Sachet',
  'Vaccine',
  'Antibiotic',
  'Analgesic / Antipyretic',
  'Antidiabetic',
  'Antihistamine',
  'Other / Custom',
];

const commonManufacturers = [
  'Cipla Ltd',
  'Sun Pharma',
  'Dr. Reddy\'s Lab',
  'Abbott India',
  'Lupin Ltd',
  'Mankind Pharma',
  'Torrent Pharma',
  'Alkem Laboratories',
  'Glenmark Pharmaceuticals',
  'Zydus Lifesciences',
  'Generic / Govt. Supply',
];

const emptyForm = {
  medicine_id: '',
  name: '',
  custom_name: '',
  category: 'Tablet',
  custom_category: '',
  manufacturer: '',
  custom_manufacturer: '',
  description: '',
  quantity: '100',
  threshold: '20',
  price: '45.00',
  batch_number: '',
  expiry_date: '',
};

const Inventory = () => {
  const { searchTerm, setSearchTerm } = useSearch();
  const { pharmacyProfile } = useAuth();
  const { medicines, stock, loading, mutating, createStockItem, saveStockItem, deleteStockItem } = useData();

  const [showModal, setShowModal] = useState(false);
  const [isCustomMed, setIsCustomMed] = useState(false);
  const [selectedCatalogMed, setSelectedCatalogMed] = useState(null);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [actionError, setActionError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [editItem, setEditItem] = useState(null);
  const [newMed, setNewMed] = useState(emptyForm);
  const [filterCategory, setFilterCategory] = useState('ALL');

  const getMedicine = (medicineId) =>
    medicines.find((medicine) => medicine.medicine_id === medicineId) || {};

  const categories = Array.from(
    new Set(
      stock
        .map((item) => getMedicine(item.medicine_id).category || item.category || 'General')
        .filter(Boolean)
    )
  );

  const filteredStock = stock.filter((item) => {
    const med = getMedicine(item.medicine_id);
    const medName = (med.name || med.medicine_name || item.name || 'Unknown').toLowerCase();
    const batch = (item.batch_number || '').toLowerCase();
    const cat = (med.category || med.medicine_category || item.category || '').toLowerCase();

    const matchesSearch =
      medName.includes(searchTerm.toLowerCase()) ||
      batch.includes(searchTerm.toLowerCase()) ||
      cat.includes(searchTerm.toLowerCase());

    const matchesCat =
      filterCategory === 'ALL' ||
      (med.category || item.category || '').toLowerCase() === filterCategory.toLowerCase();

    return matchesSearch && matchesCat;
  });

  const existingStockMedMap = useMemo(() => {
    const map = new Map();
    stock.forEach((item) => {
      map.set(item.medicine_id, item);
    });
    return map;
  }, [stock]);

  // Dynamic filtering of existing central catalog medicines
  const matchingCatalogMeds = useMemo(() => {
    const q = addSearchQuery.trim().toLowerCase();
    if (!q) {
      return medicines.slice(0, 12);
    }
    return medicines.filter((m) => {
      const name = (m.name || m.medicine_name || '').toLowerCase();
      const cat = (m.category || m.medicine_category || '').toLowerCase();
      const mfr = (m.manufacturer || m.manufacturer_name || '').toLowerCase();
      const mid = (m.medicine_id || '').toLowerCase();
      return name.includes(q) || cat.includes(q) || mfr.includes(q) || mid.includes(q);
    });
  }, [addSearchQuery, medicines]);

  // Select a medicine from central catalog
  const handleSelectCatalogMed = (med) => {
    setSelectedCatalogMed(med);
    setIsCustomMed(false);
    setActionError('');
    setNewMed((prev) => ({
      ...prev,
      medicine_id: med.medicine_id,
      name: med.name || med.medicine_name,
      category: med.category || med.medicine_category || 'Tablet',
      manufacturer: med.manufacturer || med.manufacturer_name || '',
      description: med.description || '',
    }));
  };

  // Start registering a custom / new product
  const handleStartCreateNew = (customName = '') => {
    const name = customName || addSearchQuery.trim();
    setSelectedCatalogMed(null);
    setIsCustomMed(true);
    setActionError('');
    setNewMed((prev) => ({
      ...prev,
      medicine_id: '',
      name: name,
      custom_name: name,
      category: 'Tablet',
      custom_category: '',
      manufacturer: '',
      custom_manufacturer: '',
      description: '',
    }));
  };

  // Reset Add Modal selection back to search
  const handleResetSelection = () => {
    setSelectedCatalogMed(null);
    setIsCustomMed(false);
    setAddSearchQuery('');
    setActionError('');
    setNewMed({
      ...emptyForm,
      batch_number: `BATCH-${Date.now().toString().slice(-5).toUpperCase()}`,
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
  };

  // Open modal
  const handleOpenAddModal = () => {
    handleResetSelection();
    setShowModal(true);
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    setActionError('');

    try {
      if (selectedCatalogMed) {
        if (!newMed.quantity || Number(newMed.quantity) <= 0) {
          setActionError('Please enter a valid stock quantity.');
          return;
        }
        if (newMed.price === undefined || newMed.price === '' || Number(newMed.price) < 0) {
          setActionError('Please enter a valid unit price.');
          return;
        }
        if (!newMed.batch_number?.trim()) {
          setActionError('Batch number is required.');
          return;
        }
        if (!newMed.expiry_date) {
          setActionError('Expiry date is required.');
          return;
        }

        const result = await createStockItem({
          provider_id: pharmacyProfile?.provider_id || 'PROV-PHM-001',
          medicine_id: selectedCatalogMed.medicine_id,
          quantity: Number(newMed.quantity),
          threshold: Number(newMed.threshold || 10),
          price: Number(newMed.price),
          batch_number: newMed.batch_number.trim().toUpperCase(),
          expiry_date: newMed.expiry_date,
        });

        if (!result.success) {
          setActionError(result.error || 'Failed to add stock item.');
          return;
        }

        const medName = selectedCatalogMed.name || selectedCatalogMed.medicine_name;
        setToastMessage(`✓ Added "${medName}" (${newMed.batch_number.trim().toUpperCase()}) to inventory!`);
        setTimeout(() => setToastMessage(''), 7000);
        setShowModal(false);
        handleResetSelection();
      } else if (isCustomMed) {
        const cleanName = (newMed.name || newMed.custom_name || '').trim();
        if (!cleanName) {
          setActionError('Product / Medicine name is required.');
          return;
        }
        if (!newMed.quantity || Number(newMed.quantity) <= 0) {
          setActionError('Please enter a valid stock quantity.');
          return;
        }
        if (newMed.price === undefined || newMed.price === '' || Number(newMed.price) < 0) {
          setActionError('Please enter a valid unit price.');
          return;
        }
        if (!newMed.batch_number?.trim()) {
          setActionError('Batch number is required.');
          return;
        }
        if (!newMed.expiry_date) {
          setActionError('Expiry date is required.');
          return;
        }

        const finalCat =
          newMed.category === 'Other / Custom'
            ? (newMed.custom_category || '').trim() || 'General'
            : (newMed.category || 'Tablet').trim();

        const result = await createStockItem({
          provider_id: pharmacyProfile?.provider_id || 'PROV-PHM-001',
          is_custom: true,
          custom_name: cleanName,
          custom_category: finalCat,
          custom_manufacturer: (newMed.manufacturer || newMed.custom_manufacturer || 'Generic Pharma').trim(),
          description: (newMed.description || '').trim(),
          quantity: Number(newMed.quantity),
          threshold: Number(newMed.threshold || 10),
          price: Number(newMed.price),
          batch_number: newMed.batch_number.trim().toUpperCase(),
          expiry_date: newMed.expiry_date,
        });

        if (!result.success) {
          setActionError(result.error || 'Failed to register product.');
          return;
        }

        setToastMessage(`✨ Registered new product "${cleanName}" into central catalog and added to inventory!`);
        setTimeout(() => setToastMessage(''), 7000);
        setShowModal(false);
        handleResetSelection();
      } else {
        setActionError('Please select a medicine from the central catalog or click "Register New Product".');
      }
    } catch (err) {
      setActionError(err.message || 'An unexpected error occurred.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    const result = await saveStockItem(editItem.stock_id, {
      quantity: Number(editItem.quantity),
      threshold: Number(editItem.threshold),
      price: Number(editItem.price || 0),
      batch_number: editItem.batch_number,
      expiry_date: editItem.expiry_date,
    });

    if (result.success) {
      setToastMessage(`✓ Updated stock for "${editItem.name || 'product'}" successfully.`);
      setTimeout(() => setToastMessage(''), 6000);
      setEditItem(null);
    }
  };

  const handleQuickAdjust = async (item, delta) => {
    const nextQty = Math.max(0, Number(item.quantity || 0) + delta);
    await saveStockItem(item.stock_id, {
      quantity: nextQty,
      threshold: item.threshold,
      price: item.price,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Medicine Inventory & ERP Stock</h1>
          <p className="page-subtitle">
            Manage your pharmacy products with prices, batch numbers, stock levels, and expiry tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Product to Stock</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {toastMessage && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/80 p-3.5 px-4 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-xs transition-all animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control Toolbar with Integrated Search & Filter Controls */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* In-page High-Clarity Search Bar */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search medicine, batch number, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium transition shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Category:
            </span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3.5 py-2.5 text-xs md:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-xs"
            >
              <option value="ALL">All Categories ({stock.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Stock Metrics Pills */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
            Total Items: <strong className="text-slate-900 dark:text-white font-bold ml-1">{stock.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
            In Stock: <strong className="font-bold ml-1">{stock.filter((s) => s.quantity > s.threshold).length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
            Low Stock: <strong className="font-bold ml-1">{stock.filter((s) => s.quantity <= s.threshold && s.quantity > 0).length}</strong>
          </span>
          {stock.filter((s) => s.quantity === 0).length > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800">
              Out of Stock: <strong className="font-bold ml-1">{stock.filter((s) => s.quantity === 0).length}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Spacious, Modern Inventory Records Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Medicine & Details
                </th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Batch No
                </th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Unit Price
                </th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Quantity
                </th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Stock Status
                </th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Expiry Date
                </th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Last Updated
                </th>
                <th className="py-4 px-5 text-right text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading && (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Loading pharmacy inventory records...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredStock.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-14 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-base font-bold text-slate-900 dark:text-white">No Medicine Inventory Records Found</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {searchTerm || filterCategory !== 'ALL'
                        ? 'No products match your current search or category filter. Try clearing filters.'
                        : 'Click "Add Product to Stock" above to record your first inventory item.'}
                    </p>
                  </td>
                </tr>
              )}

              {filteredStock.map((item) => {
                const medicine = getMedicine(item.medicine_id);
                const medName = medicine.name || medicine.medicine_name || item.name || 'Unknown Medicine';
                const medCat = medicine.category || medicine.medicine_category || item.category || 'General';
                const manufacturer = medicine.manufacturer || medicine.manufacturer_name || 'Standard';

                const isOutOfStock = Number(item.quantity) === 0;
                const isLow = !isOutOfStock && Number(item.quantity) <= Number(item.threshold);

                const expiryDays = item.expiry_date
                  ? Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : 365;
                const isExpiringSoon = expiryDays > 0 && expiryDays <= 90;
                const isExpired = expiryDays <= 0;

                return (
                  <tr
                    key={item.stock_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-4.5 px-5">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                          {medName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60">
                            {medCat}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {manufacturer}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4.5 px-4">
                      <span className="inline-flex font-mono text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs">
                        {item.batch_number || 'N/A'}
                      </span>
                    </td>

                    <td className="py-4.5 px-4">
                      <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                        ₹{(Number(item.price) || 0).toFixed(2)}
                      </span>
                    </td>

                    <td className="py-4.5 px-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-base font-extrabold ${
                            isOutOfStock
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLow
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          (Min: {item.threshold})
                        </span>
                        <div className="inline-flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item, 10)}
                            title="Add 10 units"
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-teal-600 hover:text-white dark:bg-slate-800 dark:hover:bg-teal-600 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-all shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 cursor-pointer text-xs"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item, -10)}
                            title="Deduct 10 units"
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-all shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 cursor-pointer text-xs"
                          >
                            -
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-4.5 px-4">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          In Stock
                        </span>
                      )}
                    </td>

                    <td className="py-4.5 px-4">
                      <div>
                        <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {item.expiry_date || 'N/A'}
                        </span>
                        {isExpired ? (
                          <span className="block mt-1">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              Expired
                            </span>
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="block mt-1">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Exp in {expiryDays}d
                            </span>
                          </span>
                        ) : (
                          <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            Valid Stock
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4.5 px-4">
                      <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                        {item.last_updated ? item.last_updated.slice(0, 10) : 'Recent'}
                      </span>
                    </td>

                    <td className="py-4.5 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditItem({ ...item })}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 border border-teal-200 dark:border-teal-800/80 font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${medName} from stock?`)) {
                              deleteStockItem(item.stock_id);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-800/80 font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Stock Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-7 shadow-2xl text-slate-900 dark:text-white my-8 max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowModal(false);
                handleResetSelection();
              }}
              className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="mb-5 pr-8">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <span>Add Product to Pharmacy Inventory</span>
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Search SMC Central Medicine Catalog or dynamically register a new medicine product into catalog and stock.
              </p>
            </div>

            {/* Error Banner */}
            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <svg className="w-4 h-4 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{actionError}</span>
              </div>
            )}

            {/* Top Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl mb-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setIsCustomMed(false);
                  setActionError('');
                }}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isCustomMed
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search Central Catalog</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartCreateNew(addSearchQuery)}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isCustomMed
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Register New Medicine</span>
              </button>
            </div>

            {/* STAGE 1: DYNAMIC SEARCH FROM CATALOG (when !selectedCatalogMed && !isCustomMed) */}
            {!selectedCatalogMed && !isCustomMed && (
              <div className="space-y-4">
                {/* Search Input Bar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Search SMC Medicine Catalog:</span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      Type to filter or register new if not found
                    </span>
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={addSearchQuery}
                      onChange={(e) => setAddSearchQuery(e.target.value)}
                      placeholder="Search by medicine name, category, manufacturer, or MED-ID..."
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-xs"
                      autoFocus
                    />
                    {addSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setAddSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Integrated In-Flow Medicine Browser Panel (Like Lab's Test Browser) */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs flex flex-col">
                  {/* Panel Header */}
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {addSearchQuery.trim() ? `Search Results for "${addSearchQuery}"` : 'SMC Central Medicine Catalog'}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                      {matchingCatalogMeds.length} medicines
                    </span>
                  </div>

                  {/* Scrollable list items */}
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                    {matchingCatalogMeds.length > 0 ? (
                      matchingCatalogMeds.map((med) => {
                        const medName = med.name || med.medicine_name;
                        const medCat = med.category || med.medicine_category || 'Tablet';
                        const manufacturer = med.manufacturer || med.manufacturer_name || 'Standard';
                        const existingStock = existingStockMedMap.get(med.medicine_id);

                        return (
                          <div
                            key={med.medicine_id}
                            onClick={() => handleSelectCatalogMed(med)}
                            className="p-3 transition-colors flex items-center justify-between gap-3 hover:bg-teal-50/70 dark:hover:bg-teal-950/40 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0 font-bold text-xs">
                                💊
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                    {medName}
                                  </p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {medCat}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                    {med.medicine_id}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  <span>{manufacturer}</span>
                                  {med.description && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-xs">{med.description}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {existingStock && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  In Stock: {existingStock.quantity}
                                </span>
                              )}
                              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 group-hover:bg-teal-600 group-hover:text-white transition-all flex items-center gap-1 shadow-2xs">
                                <span>Select</span>
                                <span>→</span>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <svg className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          No existing medicines found matching "{addSearchQuery}"
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          You can register this as a new medicine in the SMC catalog below.
                        </p>
                      </div>
                    )}

                    {/* DYNAMIC SCENARIO ACTION: REGISTER AS NEW PRODUCT IN MASTER LIST (Matches Lab Pattern!) */}
                    {addSearchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => handleStartCreateNew(addSearchQuery.trim())}
                        className="w-full text-left p-3.5 bg-gradient-to-r from-teal-50/90 to-emerald-50/90 hover:from-teal-100 hover:to-emerald-100 dark:from-teal-950/50 dark:to-emerald-950/50 dark:hover:from-teal-900/70 dark:hover:to-emerald-900/70 flex items-center justify-between gap-3 text-xs font-bold text-teal-900 dark:text-teal-200 transition-all cursor-pointer border-t border-teal-200 dark:border-teal-800"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-sm">
                            +
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 block tracking-wider">
                              Can't find it in catalog?
                            </span>
                            <span className="truncate block font-extrabold text-slate-900 dark:text-white text-xs">
                              Register new medicine in catalog:{' '}
                              <strong className="text-teal-700 dark:text-teal-400 underline decoration-teal-400">
                                "{addSearchQuery.trim()}"
                              </strong>
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-teal-600 text-white shadow-xs">
                          Register New
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                    Click any medicine above to record initial batch and pricing.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      handleResetSelection();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: SELECTED EXISTING CATALOG MEDICINE */}
            {selectedCatalogMed && !isCustomMed && (
              <form onSubmit={handleAddSubmit} className="space-y-4">
                {/* Selected Med Summary Card */}
                <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 flex items-center justify-center shrink-0 text-lg">
                      💊
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900/80 dark:text-teal-200">
                          SMC Catalog
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {selectedCatalogMed.category || selectedCatalogMed.medicine_category || 'Tablet'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {selectedCatalogMed.medicine_id}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
                        {selectedCatalogMed.name || selectedCatalogMed.medicine_name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                        Manufacturer: {selectedCatalogMed.manufacturer || selectedCatalogMed.manufacturer_name || 'Standard'}
                      </p>
                      {selectedCatalogMed.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                          {selectedCatalogMed.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetSelection}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer transition-all shadow-xs flex items-center gap-1"
                    title="Choose a different medicine"
                  >
                    <span>←</span>
                    <span>Change</span>
                  </button>
                </div>

                {/* Stock Details Form Inputs */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unit Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition shadow-xs overflow-hidden">
                      <span className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs border-r border-slate-300 dark:border-slate-600">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="45.00"
                        className="w-full px-3 py-2 bg-transparent text-slate-900 dark:text-white text-sm font-bold outline-none"
                        value={newMed.price}
                        onChange={(e) => setNewMed({ ...newMed, price: e.target.value })}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Batch Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BATCH-2026-X"
                      className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white uppercase font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                      value={newMed.batch_number}
                      onChange={(e) => setNewMed({ ...newMed, batch_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Stock Quantity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="100"
                      className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                      value={newMed.quantity}
                      onChange={(e) => setNewMed({ ...newMed, quantity: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Low Stock Threshold <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="20"
                      className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                      value={newMed.threshold}
                      onChange={(e) => setNewMed({ ...newMed, threshold: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                    value={newMed.expiry_date}
                    onChange={(e) => setNewMed({ ...newMed, expiry_date: e.target.value })}
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      handleResetSelection();
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mutating}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {mutating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Adding to Stock...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>Confirm & Add to Inventory</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STAGE 3: REGISTER NEW MEDICINE (when isCustomMed) */}
            {isCustomMed && (
              <form onSubmit={handleAddSubmit} className="space-y-4">
                {/* Header Notice Banner */}
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-base">✨</span>
                    <span>Registering new product into SMC Central Catalog and your inventory.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSelection}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 cursor-pointer shadow-xs"
                  >
                    ← Back to Search
                  </button>
                </div>

                {/* Section: Product Definition */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Product Master Information
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Medicine / Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Azithromycin 500mg"
                      className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                      value={newMed.name || newMed.custom_name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value, custom_name: e.target.value })}
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Dosage / Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full px-3 py-2 rounded-xl text-xs md:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs cursor-pointer"
                        value={newMed.category}
                        onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                      >
                        {standardMedCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Manufacturer <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        list="manufacturers-list"
                        placeholder="e.g. Cipla Ltd"
                        className="w-full px-3 py-2 rounded-xl text-xs md:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                        value={newMed.manufacturer || newMed.custom_manufacturer}
                        onChange={(e) =>
                          setNewMed({ ...newMed, manufacturer: e.target.value, custom_manufacturer: e.target.value })
                        }
                      />
                      <datalist id="manufacturers-list">
                        {commonManufacturers.map((m) => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {newMed.category === 'Other / Custom' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Specify Custom Category <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Herbal Supplement, First-aid"
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                        value={newMed.custom_category}
                        onChange={(e) => setNewMed({ ...newMed, custom_category: e.target.value })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Description / Composition (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Broad-spectrum macrolide antibiotic."
                      className="w-full px-3 py-2 rounded-xl text-xs md:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                      value={newMed.description}
                      onChange={(e) => setNewMed({ ...newMed, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Section: Stock Details */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Inventory Stock & Pricing
                  </h4>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Unit Price (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition shadow-xs overflow-hidden">
                        <span className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs border-r border-slate-300 dark:border-slate-600">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="45.00"
                          className="w-full px-3 py-2 bg-transparent text-slate-900 dark:text-white text-sm font-bold outline-none"
                          value={newMed.price}
                          onChange={(e) => setNewMed({ ...newMed, price: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Batch Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="BATCH-2026-X"
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white uppercase font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                        value={newMed.batch_number}
                        onChange={(e) => setNewMed({ ...newMed, batch_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Stock Quantity <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="100"
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                        value={newMed.quantity}
                        onChange={(e) => setNewMed({ ...newMed, quantity: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Low Stock Alert Threshold <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="20"
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                        value={newMed.threshold}
                        onChange={(e) => setNewMed({ ...newMed, threshold: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expiry Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition shadow-xs"
                      value={newMed.expiry_date}
                      onChange={(e) => setNewMed({ ...newMed, expiry_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      handleResetSelection();
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mutating}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {mutating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Registering Product...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Register & Add to Inventory</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl text-slate-900 dark:text-white my-8">
            <button
              onClick={() => setEditItem(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Update Stock Information</h3>
            <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
              Modify pricing, stock on hand, batch number, or expiry date.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    value={editItem.price || ''}
                    onChange={(event) => setEditItem({ ...editItem, price: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Batch Number</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
                    value={editItem.batch_number || ''}
                    onChange={(event) => setEditItem({ ...editItem, batch_number: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Quantity on Hand</label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    value={editItem.quantity}
                    onChange={(event) => setEditItem({ ...editItem, quantity: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reorder Threshold</label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={editItem.threshold}
                    onChange={(event) => setEditItem({ ...editItem, threshold: event.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Expiry Date</label>
                <input
                  type="date"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={editItem.expiry_date}
                  onChange={(event) => setEditItem({ ...editItem, expiry_date: event.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md transition cursor-pointer disabled:opacity-60"
                disabled={mutating}
              >
                {mutating ? 'Saving...' : 'Save Product Updates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
