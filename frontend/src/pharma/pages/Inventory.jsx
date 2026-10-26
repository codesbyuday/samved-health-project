import React, { useState } from 'react';
import { useSearch } from '../context/searchcontext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const emptyForm = {
  medicine_id: '',
  custom_name: '',
  custom_category: 'Tablet',
  custom_manufacturer: '',
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

  const handleAddSubmit = async (event) => {
    event.preventDefault();

    let targetMedId = newMed.medicine_id;
    if (isCustomMed || !targetMedId) {
      targetMedId = `MED-CUST-${Date.now().toString().slice(-6)}`;
    }

    const result = await createStockItem({
      provider_id: pharmacyProfile?.provider_id || 'PROV-PHM-001',
      medicine_id: targetMedId,
      quantity: Number(newMed.quantity || 0),
      threshold: Number(newMed.threshold || 10),
      price: Number(newMed.price || 0),
      batch_number: newMed.batch_number || `BATCH-${Date.now().toString().slice(-6)}`,
      expiry_date: newMed.expiry_date || '2026-12-31',
    });

    if (result.success) {
      setShowModal(false);
      setNewMed(emptyForm);
      setIsCustomMed(false);
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
            onClick={() => {
              setNewMed({
                ...emptyForm,
                batch_number: `BATCH-${Date.now().toString().slice(-5)}`,
                expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Product to Stock</span>
          </button>
        </div>
      </div>

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
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl text-slate-900 dark:text-white my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Add Product to Pharmacy Inventory</h3>
            <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
              Enter product pricing, batch details, and initial stock quantities for this facility.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="flex items-center gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="medType"
                    checked={!isCustomMed}
                    onChange={() => setIsCustomMed(false)}
                    className="accent-teal-600 w-4 h-4"
                  />
                  <span>Select from Central Catalog</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="medType"
                    checked={isCustomMed}
                    onChange={() => setIsCustomMed(true)}
                    className="accent-teal-600 w-4 h-4"
                  />
                  <span>Add Custom Medicine</span>
                </label>
              </div>

              {!isCustomMed ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Medicine <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-xs"
                    value={newMed.medicine_id}
                    onChange={(event) => setNewMed({ ...newMed, medicine_id: event.target.value })}
                  >
                    <option value="">-- Choose Medicine from Catalog --</option>
                    {medicines.map((medicine) => (
                      <option key={medicine.medicine_id} value={medicine.medicine_id}>
                        {medicine.name || medicine.medicine_name} ({medicine.category || medicine.medicine_category || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Medicine Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Azithromycin 500mg"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-xs"
                      value={newMed.custom_name}
                      onChange={(e) => setNewMed({ ...newMed, custom_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Antibiotic"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-xs"
                      value={newMed.custom_category}
                      onChange={(e) => setNewMed({ ...newMed, custom_category: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Cipla Ltd"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-xs"
                      value={newMed.custom_manufacturer}
                      onChange={(e) => setNewMed({ ...newMed, custom_manufacturer: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Unit Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="45.00"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-xs font-semibold"
                    value={newMed.price}
                    onChange={(event) => setNewMed({ ...newMed, price: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BATCH-2026-X"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-xs uppercase font-mono"
                    value={newMed.batch_number}
                    onChange={(event) => setNewMed({ ...newMed, batch_number: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-xs font-semibold"
                    value={newMed.quantity}
                    onChange={(event) => setNewMed({ ...newMed, quantity: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Low Stock Alert Threshold <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-xs"
                    value={newMed.threshold}
                    onChange={(event) => setNewMed({ ...newMed, threshold: event.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-xs"
                  value={newMed.expiry_date}
                  onChange={(event) => setNewMed({ ...newMed, expiry_date: event.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full mt-5 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                disabled={mutating}
              >
                {mutating ? 'Saving Product...' : 'Confirm & Add to Inventory'}
              </button>
            </form>
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
