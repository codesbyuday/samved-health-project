import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';
import { formatCurrency } from '../lib/format';

function getCategoryColor(category = '') {
  const cat = category.toLowerCase();
  if (cat.includes('hemato')) return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  if (cat.includes('bioch')) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  if (cat.includes('endo')) return 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800';
  if (cat.includes('sero') || cat.includes('immuno')) return 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800';
  if (cat.includes('radio') || cat.includes('cardio')) return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  if (cat.includes('micro') || cat.includes('molec')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
}

function getTestIcon(name = '', category = '') {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (n.includes('blood') || n.includes('cbc') || c.includes('hemato')) return 'fa-droplet text-rose-500';
  if (n.includes('thyroid') || c.includes('endo')) return 'fa-dna text-sky-500';
  if (n.includes('heart') || n.includes('ecg') || n.includes('troponin') || c.includes('cardio')) return 'fa-heart-pulse text-red-500';
  if (n.includes('sugar') || n.includes('glucose') || n.includes('lipid') || c.includes('bioch')) return 'fa-flask-vial text-amber-500';
  if (n.includes('crp') || n.includes('dengue') || n.includes('hiv') || c.includes('sero') || c.includes('immuno')) return 'fa-shield-halved text-teal-500';
  if (n.includes('x-ray') || n.includes('scan') || c.includes('radio')) return 'fa-x-ray text-blue-500';
  if (n.includes('urine') || n.includes('culture') || c.includes('micro')) return 'fa-vial text-emerald-500';
  return 'fa-vials text-cyan-600';
}

const standardCategories = [
  'Hematology',
  'Biochemistry',
  'Endocrinology',
  'Serology',
  'Immunology',
  'Microbiology',
  'Radiology',
  'Cardiology',
  'Pathology',
  'Molecular',
  'Clinical Pathology',
];

const TestCatalog = () => {
  const {
    providerCatalog,
    testTypes,
    createCatalogTest,
    updateCatalogTest,
    deleteCatalogTest,
    saving,
  } = useAppData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Selected item for Edit / Delete
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [currentDeleteItem, setCurrentDeleteItem] = useState(null);

  // Unified dynamic Add Investigation state
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMasterTest, setSelectedMasterTest] = useState(null);
  const [isCreatingNewTest, setIsCreatingNewTest] = useState(false);
  const searchDropdownRef = useRef(null);

  // Forms state
  const [addForm, setAddForm] = useState({
    test_type_id: '',
    test_name: '',
    test_category: 'Biochemistry',
    custom_category: '',
    description: '',
    price: '',
  });

  const [editForm, setEditForm] = useState({
    lab_test_id: '',
    test_type_id: '',
    test_name: '',
    test_category: '',
    custom_category: '',
    description: '',
    price: '',
  });

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unique categories in the current lab catalog
  const catalogCategories = useMemo(() => {
    const cats = new Set();
    providerCatalog.forEach((item) => {
      if (item.test_types?.test_category) {
        cats.add(item.test_types.test_category);
      }
    });
    return Array.from(cats).sort();
  }, [providerCatalog]);

  // Existing test type IDs currently offered by this lab
  const existingLabTypeIds = useMemo(() => {
    return new Set(providerCatalog.map((t) => t.test_type_id));
  }, [providerCatalog]);

  // Master test types that this laboratory does NOT have yet
  const availableMasterTests = useMemo(() => {
    return testTypes.filter((type) => !existingLabTypeIds.has(type.test_id));
  }, [existingLabTypeIds, testTypes]);

  // Master tests matching the user's dynamic search query in Add Modal
  const matchingMasterTests = useMemo(() => {
    const q = addSearchQuery.trim().toLowerCase();
    if (!q) {
      return availableMasterTests.slice(0, 10);
    }
    return testTypes.filter((t) => {
      const name = (t.test_name || '').toLowerCase();
      const cat = (t.test_category || '').toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  }, [addSearchQuery, availableMasterTests, testTypes]);

  // Check if query is an exact match to an existing master test
  const hasExactMasterMatch = useMemo(() => {
    const q = addSearchQuery.trim().toLowerCase();
    if (!q) return false;
    return testTypes.some((t) => (t.test_name || '').trim().toLowerCase() === q);
  }, [addSearchQuery, testTypes]);

  // Overview stats
  const catalogStats = useMemo(() => {
    const count = providerCatalog.length;
    if (count === 0) return { count: 0, avgPrice: 0, minPrice: 0, maxPrice: 0, categoriesCount: 0 };
    const prices = providerCatalog.map((t) => Number(t.price) || 0);
    const sum = prices.reduce((a, b) => a + b, 0);
    return {
      count,
      avgPrice: Math.round(sum / count),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      categoriesCount: catalogCategories.length,
    };
  }, [catalogCategories.length, providerCatalog]);

  // Filtered and sorted catalog list
  const filteredCatalog = useMemo(() => {
    let list = providerCatalog.filter((item) => {
      const name = item.test_types?.test_name || '';
      const cat = item.test_types?.test_category || '';
      const desc = item.test_types?.description || '';
      const term = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !term ||
        name.toLowerCase().includes(term) ||
        cat.toLowerCase().includes(term) ||
        desc.toLowerCase().includes(term);

      const matchesCategory =
        selectedCategory === 'All' || cat.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });

    list.sort((a, b) => {
      const nameA = a.test_types?.test_name || '';
      const nameB = b.test_types?.test_name || '';
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;

      if (sortBy === 'name-asc') return nameA.localeCompare(nameB);
      if (sortBy === 'name-desc') return nameB.localeCompare(nameA);
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      return 0;
    });

    return list;
  }, [providerCatalog, searchTerm, selectedCategory, sortBy]);

  // Open Edit Modal
  const handleOpenEdit = (test) => {
    setCurrentEditItem(test);
    const testCat = test.test_types?.test_category || 'Biochemistry';
    const isStandard = standardCategories.includes(testCat);

    setEditForm({
      lab_test_id: test.lab_test_id,
      test_type_id: test.test_type_id,
      test_name: test.test_types?.test_name || '',
      test_category: isStandard ? testCat : 'Custom',
      custom_category: isStandard ? '' : testCat,
      description: test.test_types?.description || '',
      price: test.price || '',
    });
    setActionError('');
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const finalCategory =
        editForm.test_category === 'Custom'
          ? editForm.custom_category.trim() || 'General Pathology'
          : editForm.test_category;

      await updateCatalogTest(editForm.lab_test_id, {
        price: Number(editForm.price),
        test_type_id: editForm.test_type_id,
        test_name: editForm.test_name.trim(),
        test_category: finalCategory,
        // Clinical description is master-locked and not editable
      });

      setIsEditOpen(false);
      setActionSuccess(`Successfully updated "${editForm.test_name}".`);
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err) {
      setActionError(err?.message || 'Failed to update test.');
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (test) => {
    setCurrentDeleteItem(test);
    setActionError('');
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!currentDeleteItem) return;
    setActionError('');
    try {
      await deleteCatalogTest(currentDeleteItem.lab_test_id);
      setIsDeleteOpen(false);
      const testName = currentDeleteItem.test_types?.test_name || 'Test';
      setCurrentDeleteItem(null);
      setActionSuccess(`Removed "${testName}" from laboratory catalog.`);
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err) {
      setActionError(err?.message || 'Failed to remove test from catalog.');
    }
  };

  // Open Unified Add Modal
  const handleOpenAdd = () => {
    setAddSearchQuery('');
    setIsDropdownOpen(false);
    setSelectedMasterTest(null);
    setIsCreatingNewTest(false);
    setAddForm({
      test_type_id: '',
      test_name: '',
      test_category: 'Biochemistry',
      custom_category: '',
      description: '',
      price: '',
    });
    setActionError('');
    setIsAddOpen(true);
  };

  // Select an existing test from master list suggestions
  const handleSelectMasterTest = (masterTest) => {
    if (existingLabTypeIds.has(masterTest.test_id)) {
      setActionError(`"${masterTest.test_name}" is already in your laboratory catalog. You can edit its price directly.`);
      return;
    }
    setSelectedMasterTest(masterTest);
    setIsCreatingNewTest(false);
    setIsDropdownOpen(false);
    setActionError('');
    setAddForm({
      test_type_id: masterTest.test_id,
      test_name: masterTest.test_name,
      test_category: masterTest.test_category || 'Biochemistry',
      custom_category: '',
      description: masterTest.description || '',
      price: '',
    });
  };

  // Trigger creating a new master test definition
  const handleStartCreateNew = (customName) => {
    const name = customName || addSearchQuery.trim();
    setSelectedMasterTest(null);
    setIsCreatingNewTest(true);
    setIsDropdownOpen(false);
    setActionError('');
    setAddForm({
      test_type_id: '',
      test_name: name,
      test_category: 'Biochemistry',
      custom_category: '',
      description: '',
      price: '',
    });
  };

  // Reset back to initial search state
  const handleResetAddSelection = () => {
    setSelectedMasterTest(null);
    setIsCreatingNewTest(false);
    setAddSearchQuery('');
    setIsDropdownOpen(true);
    setActionError('');
    setAddForm({
      test_type_id: '',
      test_name: '',
      test_category: 'Biochemistry',
      custom_category: '',
      description: '',
      price: '',
    });
  };

  // Submit Add
  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      if (selectedMasterTest) {
        if (!addForm.price || Number(addForm.price) < 0) {
          setActionError('Please enter a valid laboratory fee.');
          return;
        }

        await createCatalogTest({
          test_type_id: Number(selectedMasterTest.test_id),
          price: Number(addForm.price) || 0,
        });

        setIsAddOpen(false);
        setActionSuccess(`Added "${selectedMasterTest.test_name}" to your laboratory catalog.`);
        setTimeout(() => setActionSuccess(''), 3500);
      } else if (isCreatingNewTest) {
        if (!addForm.test_name.trim()) {
          setActionError('Investigation name cannot be empty.');
          return;
        }
        if (!addForm.price || Number(addForm.price) < 0) {
          setActionError('Please enter a valid laboratory fee.');
          return;
        }

        const finalCategory =
          addForm.test_category === 'Custom'
            ? addForm.custom_category.trim() || 'General Pathology'
            : addForm.test_category;

        await createCatalogTest({
          test_name: addForm.test_name.trim(),
          test_category: finalCategory,
          description: addForm.description.trim(),
          price: Number(addForm.price) || 0,
        });

        setIsAddOpen(false);
        setActionSuccess(`Registered new investigation "${addForm.test_name}" into master catalog and added to your lab.`);
        setTimeout(() => setActionSuccess(''), 3500);
      } else {
        setActionError('Please select a test from the master catalog or register a new test type.');
      }
    } catch (err) {
      setActionError(err?.message || 'Failed to add test to catalog.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Diagnostic Investigation Management
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Laboratory Test Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Configure investigation menu, update patient fees, manage clinical preparation notes, and add new test types.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/20 cursor-pointer shrink-0 transition-all"
        >
          <i className="fa-solid fa-plus"></i>
          <span>Add Test to Catalog</span>
        </button>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="surface-card rounded-2xl p-4 flex items-center gap-2.5 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-fade-in">
          <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Catalog Overview Metrics */}
      <div className="lab-grid-4">
        <div className="surface-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
              <i className="fa-solid fa-vials text-lg"></i>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Tests</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{catalogStats.count}</h3>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Offered by your lab</p>
        </div>

        <div className="surface-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <i className="fa-solid fa-folder-tree text-lg"></i>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Categories</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{catalogStats.categoriesCount}</h3>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Diagnostic departments</p>
        </div>

        <div className="surface-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <i className="fa-solid fa-indian-rupee-sign text-lg"></i>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Fee</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(catalogStats.avgPrice)}</h3>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Across catalog tests</p>
        </div>

        <div className="surface-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
              <i className="fa-solid fa-tags text-lg"></i>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Price Range</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {catalogStats.count > 0 ? `${formatCurrency(catalogStats.minPrice)} - ${formatCurrency(catalogStats.maxPrice)}` : '₹0'}
              </h3>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Min to max test fee</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card rounded-3xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tests by name, category, or clinical notes..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Tests ({providerCatalog.length})
          </button>

          {catalogCategories.map((category) => {
            const count = providerCatalog.filter(
              (t) => t.test_types?.test_category?.toLowerCase() === category.toLowerCase(),
            ).length;
            const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog Cards Grid */}
      {filteredCatalog.length === 0 ? (
        <div className="surface-card rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 border border-slate-200 dark:border-slate-800">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-2xl text-cyan-600">
            <i className="fa-solid fa-vial-virus"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No matching diagnostic tests found</h3>
          <p className="text-xs max-w-md mx-auto">
            {searchTerm || selectedCategory !== 'All'
              ? 'Try adjusting your search criteria or category filter.'
              : 'Your test catalog is currently empty. Click "Add Test to Catalog" to configure your investigations.'}
          </p>
          {(searchTerm || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="lab-grid-3">
          {filteredCatalog.map((test) => {
            const testName = test.test_types?.test_name || `Test #${test.test_type_id}`;
            const testCat = test.test_types?.test_category || 'General';
            const testDesc = test.test_types?.description || 'Standard diagnostic test protocol.';
            const colorPill = getCategoryColor(testCat);

            return (
              <div
                key={test.lab_test_id}
                className="surface-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between group hover:border-cyan-500/40 transition-all duration-200 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorPill}`}
                    >
                      <i className={`fa-solid ${getTestIcon(testName, testCat)} text-xs`}></i>
                      <span>{testCat}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(test)}
                        title="Edit test price and details"
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition-all cursor-pointer"
                      >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                      </button>

                      <button
                        onClick={() => handleOpenDelete(test)}
                        title="Remove from laboratory catalog"
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-3 font-bold text-base text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {testName}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                    {testDesc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                      Fee (₹)
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(test.price)}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Live
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD TEST TO CATALOG (SINGLE UNIFIED SEARCH & DYNAMIC CREATION FLOW) */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Diagnostic Investigation"
        subtitle="Search SMC master catalog or dynamically register a new test type"
        icon="fa-flask-vial"
        maxWidth="max-w-2xl"
        minHeight="min-h-[540px]"
      >
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          {actionError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-shake">
              <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm"></i>
              <span>{actionError}</span>
            </div>
          )}

          <form onSubmit={handleSaveAdd} className="space-y-4 flex-1 flex flex-col justify-between">
            {/* STAGE 1: SEARCH / SELECT TEST (Shown initially when no test is selected and not creating new) */}
            {!selectedMasterTest && !isCreatingNewTest && (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <i className="fa-solid fa-magnifying-glass text-cyan-600 text-xs"></i>
                      <span>Select or Search Test Type <span className="text-rose-500">*</span></span>
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={addSearchQuery}
                        onChange={(e) => {
                          setAddSearchQuery(e.target.value);
                          setActionError('');
                        }}
                        placeholder="Type test name (e.g. Lipid Profile, Troponin, CBC, Blood)..."
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all shadow-xs"
                        autoFocus
                      />
                      <i className="fa-solid fa-vial absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-600 text-xs"></i>
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

                  {/* INTEGRATED IN-FLOW TEST BROWSER PANEL (NOT ABSOLUTE - PREVENTS SQUISHED WINDOWS) */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs flex flex-col">
                    {/* Panel Header */}
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <i className="fa-solid fa-list-check text-cyan-600"></i>
                        {addSearchQuery.trim() ? `Search Results for "${addSearchQuery}"` : 'SMC Master Catalog Tests'}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                        {matchingMasterTests.length} investigations
                      </span>
                    </div>

                    {/* Scrollable list items */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                      {matchingMasterTests.length > 0 ? (
                        matchingMasterTests.map((t) => {
                          const isAlreadyInCatalog = existingLabTypeIds.has(t.test_id);
                          return (
                            <div
                              key={t.test_id}
                              onClick={() => {
                                if (!isAlreadyInCatalog) {
                                  handleSelectMasterTest(t);
                                }
                              }}
                              className={`p-3.5 transition-colors flex items-center justify-between gap-3 ${
                                isAlreadyInCatalog
                                  ? 'bg-slate-50/60 dark:bg-slate-850/40 opacity-60 cursor-not-allowed'
                                  : 'hover:bg-cyan-50/70 dark:hover:bg-cyan-950/40 cursor-pointer group'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${getCategoryColor(
                                    t.test_category,
                                  )}`}
                                >
                                  <i className={`fa-solid ${getTestIcon(t.test_name, t.test_category)} text-xs`}></i>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                      {t.test_name}
                                    </p>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryColor(
                                        t.test_category,
                                      )}`}
                                    >
                                      {t.test_category || 'General'}
                                    </span>
                                  </div>
                                  {t.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-md">
                                      {t.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {isAlreadyInCatalog ? (
                                <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  In Your Catalog
                                </span>
                              ) : (
                                <span className="shrink-0 px-3 py-1 rounded-xl text-xs font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60 group-hover:bg-cyan-600 group-hover:text-white transition-all flex items-center gap-1.5 shadow-2xs">
                                  <span>Select</span>
                                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                          <i className="fa-solid fa-magnifying-glass text-xl text-slate-300 dark:text-slate-600 mb-1 block"></i>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            No existing investigations found matching "{addSearchQuery}"
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Click below to register this as a new test definition in the master list.
                          </p>
                        </div>
                      )}

                      {/* SCENARIO 2 ACTION: DYNAMICALLY CREATE NEW TEST IN MASTER LIST */}
                      {addSearchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => handleStartCreateNew(addSearchQuery.trim())}
                          className="w-full text-left p-3.5 bg-gradient-to-r from-cyan-50/90 to-teal-50/90 hover:from-cyan-100 hover:to-teal-100 dark:from-cyan-950/50 dark:to-teal-950/50 dark:hover:from-cyan-900/70 dark:hover:to-teal-900/70 flex items-center justify-between gap-3 text-xs font-bold text-cyan-900 dark:text-cyan-200 transition-all cursor-pointer border-t border-cyan-200 dark:border-cyan-800"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <i className="fa-solid fa-plus text-xs"></i>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 block tracking-wider">
                                Can't find it in master catalog?
                              </span>
                              <span className="truncate block font-extrabold text-slate-900 dark:text-white text-xs">
                                Add new test type in master list:{' '}
                                <strong className="text-cyan-700 dark:text-cyan-400 underline decoration-cyan-400">
                                  "{addSearchQuery.trim()}"
                                </strong>
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-cyan-600 text-white shadow-xs">
                            Create New
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stage 1 Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                    Click any investigation above to configure patient pricing.
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: EXISTING MASTER TEST SELECTED (Shows master test details + fee input) */}
            {selectedMasterTest && (
              <div className="space-y-4 animate-fade-in">
                {/* Selected Test Summary Card */}
                <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/80 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${getCategoryColor(
                        selectedMasterTest.test_category,
                      )}`}
                    >
                      <i
                        className={`fa-solid ${getTestIcon(
                          selectedMasterTest.test_name,
                          selectedMasterTest.test_category,
                        )} text-base`}
                      ></i>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/80 dark:text-cyan-200">
                          SMC Master Test
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getCategoryColor(
                            selectedMasterTest.test_category,
                          )}`}
                        >
                          {selectedMasterTest.test_category || 'General'}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                        {selectedMasterTest.test_name}
                      </h4>
                      {selectedMasterTest.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Description: </span>
                          {selectedMasterTest.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetAddSelection}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer transition-all shadow-xs"
                    title="Choose a different test"
                  >
                    <i className="fa-solid fa-arrow-rotate-left mr-1"></i>
                    Change
                  </button>
                </div>

                {/* Laboratory Fee Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <i className="fa-solid fa-indian-rupee-sign text-emerald-600 text-xs"></i>
                    <span>Set Your Laboratory Fee (₹) <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:border-cyan-500 transition-all overflow-hidden shadow-xs">
                    <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-bold text-xs border-r border-slate-200 dark:border-slate-700">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={addForm.price}
                      onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                      placeholder="e.g. 350"
                      className="w-full px-3 py-2.5 bg-transparent text-slate-900 dark:text-white text-xs md:text-sm font-bold outline-none"
                      autoFocus
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    This is the patient booking fee charged by your laboratory for this investigation.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {saving ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check text-xs"></i>
                        <span>Add to Laboratory Catalog</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: CREATE NEW TEST IN MASTER LIST (When user chooses to add a new test type) */}
            {isCreatingNewTest && (
              <div className="space-y-4 animate-fade-in">
                {/* Header notice */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2.5 text-xs font-semibold">
                    <i className="fa-solid fa-sparkles text-amber-500 text-sm"></i>
                    <span>Registering new investigation into SMC master list & your catalog.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetAddSelection}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 cursor-pointer shadow-xs"
                  >
                    ← Back to Search
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <i className="fa-solid fa-vial text-cyan-600 text-xs"></i>
                    <span>Investigation / Test Name <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={addForm.test_name}
                    onChange={(e) => setAddForm({ ...addForm, test_name: e.target.value })}
                    placeholder="e.g. High-Sensitivity Troponin I"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all shadow-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <i className="fa-solid fa-microscope text-cyan-600 text-xs"></i>
                      <span>Department Category <span className="text-rose-500">*</span></span>
                    </label>
                    <select
                      value={addForm.test_category}
                      onChange={(e) => setAddForm({ ...addForm, test_category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none cursor-pointer transition-all shadow-xs"
                      required
                    >
                      {standardCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="Custom">Custom / Other Category</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <i className="fa-solid fa-indian-rupee-sign text-emerald-600 text-xs"></i>
                      <span>Laboratory Fee (₹) <span className="text-rose-500">*</span></span>
                    </label>
                    <div className="relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:border-cyan-500 transition-all overflow-hidden shadow-xs">
                      <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-bold text-xs border-r border-slate-200 dark:border-slate-700">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={addForm.price}
                        onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                        placeholder="e.g. 450"
                        className="w-full px-3 py-2.5 bg-transparent text-slate-900 dark:text-white text-xs md:text-sm font-bold outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {addForm.test_category === 'Custom' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <i className="fa-solid fa-tag text-cyan-600 text-xs"></i>
                      <span>Specify Custom Category <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={addForm.custom_category}
                      onChange={(e) => setAddForm({ ...addForm, custom_category: e.target.value })}
                      placeholder="e.g. Specialized Toxicology"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all shadow-xs"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <i className="fa-solid fa-notes-medical text-cyan-600 text-xs"></i>
                    <span>Clinical Indication / Description</span>
                    <span className="text-[11px] font-normal text-slate-400">(Saved to master definition)</span>
                  </label>
                  <textarea
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    rows="3"
                    placeholder="Enter clinical indication, preparation guidelines, or normal reference metrics..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-medium focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none resize-none transition-all leading-relaxed shadow-xs"
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {saving ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-sparkles text-xs"></i>
                        <span>Register & Add to Catalog</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </Modal>

      {/* MODAL: EDIT TEST */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Diagnostic Investigation"
        subtitle="Update pricing, clinical department, and specimen requirements"
        icon="fa-pen-to-square"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {actionError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
              <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm"></i>
              <span>{actionError}</span>
            </div>
          )}

          {/* Test Identity Preview Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${getCategoryColor(
                  editForm.test_category,
                )}`}
              >
                <i
                  className={`fa-solid ${getTestIcon(
                    editForm.test_name,
                    editForm.test_category,
                  )} text-base`}
                ></i>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Target Investigation
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {editForm.test_name || 'Investigation Details'}
                </h4>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                Current Rate
              </span>
              <span className="text-sm font-extrabold text-cyan-700 dark:text-cyan-400">
                {currentEditItem?.price ? formatCurrency(currentEditItem.price) : '—'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-vial text-cyan-600 text-xs"></i>
              <span>Investigation / Test Name <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              value={editForm.test_name}
              onChange={(e) => setEditForm({ ...editForm, test_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-microscope text-cyan-600 text-xs"></i>
                <span>Department Category <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={editForm.test_category}
                onChange={(e) => setEditForm({ ...editForm, test_category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none cursor-pointer transition-all"
                required
              >
                {standardCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Custom">Custom / Other Category</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-indian-rupee-sign text-emerald-600 text-xs"></i>
                <span>Laboratory Fee (₹) <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:border-cyan-500 transition-all overflow-hidden">
                <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-bold text-xs border-r border-slate-200 dark:border-slate-700">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="w-full px-3 py-2.5 bg-transparent text-slate-900 dark:text-white text-xs md:text-sm font-bold outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {editForm.test_category === 'Custom' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-tag text-cyan-600 text-xs"></i>
                <span>Custom Category Name <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                value={editForm.custom_category}
                onChange={(e) => setEditForm({ ...editForm, custom_category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                required
              />
            </div>
          )}

          {/* Clinical Description: Read-Only Master Definition */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-notes-medical text-cyan-600 text-xs"></i>
                <span>Clinical Indication & Specimen Preparation</span>
              </label>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                <i className="fa-solid fa-lock text-[9px]"></i>
                Master Definition (Read-Only)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
              {editForm.description ? (
                editForm.description
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic">No clinical description recorded in master catalog.</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
              * Note: Clinical indications and instructions are defined at the master test level and cannot be modified by individual laboratories.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check text-xs"></i>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DELETE CONFIRMATION */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Remove Investigation from Catalog"
        subtitle="Confirmation required before removing this laboratory test"
        icon="fa-trash-can"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-900 dark:text-rose-200">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              <i className="fa-solid fa-triangle-exclamation text-base"></i>
            </div>
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-rose-950 dark:text-rose-100 text-sm">
                Confirm Catalog Removal
              </p>
              <p className="mt-1">
                Are you sure you want to remove{' '}
                <strong className="font-bold underline decoration-rose-300">
                  {currentDeleteItem?.test_types?.test_name || 'this test'}
                </strong>{' '}
                from your laboratory's active menu?
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-medium">
              <i className="fa-solid fa-shield-halved text-cyan-600 mr-1.5"></i>
              Patients will no longer be able to select this test from your lab. Past historical results and reports remain safely archived.
            </p>
          </div>

          {actionError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
              <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm"></i>
              <span>{actionError}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleConfirmDelete}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-trash-can text-xs"></i>
                  <span>Confirm Remove</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TestCatalog;
