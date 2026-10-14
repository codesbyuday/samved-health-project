import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    indicator: 'bg-amber-500',
  },
  confirm: {
    label: 'Confirmed',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    indicator: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
    indicator: 'bg-rose-500',
  },
  return: {
    label: 'Returned',
    badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
    indicator: 'bg-indigo-500',
  },
};

const ID_TYPE_OPTIONS = [
  'Aadhar Card',
  'Health Card',
  'Voter ID',
  'PAN Card',
  'Other',
];

const createEmptyItem = (index = 0) => ({
  id: `item-${Date.now()}-${index}`,
  stock_id: '',
  medicine_id: '',
  medicine_name: '',
  quantity: 1,
  available_qty: undefined,
  unit_price: 0,
  actual_price: 0,
  final_price: 0,
  isFinalPriceEdited: false,
  searchQuery: '',
  isDropdownOpen: false,
});

const Orders = () => {
  const { pharmacyProfile } = useAuth();
  const { stock, medicines, orders, loading, mutating, createOrder, updateOrderStatus, editOrder } = useData();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editOrderModal, setEditOrderModal] = useState(null);

  // Customer Form state
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [age, setAge] = useState('');
  const [orderStatus, setOrderStatus] = useState('confirm'); // Default status is 'confirm' as requested

  // Per-order processing state so clicking an action on one order does NOT disable others
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

  // Multi-Product Order Items state
  const [orderItems, setOrderItems] = useState([createEmptyItem(0)]);

  // Citizen ID optional fields
  const [hasCitizenId, setHasCitizenId] = useState(false);
  const [idType, setIdType] = useState('Aadhar Card');
  const [otherIdName, setOtherIdName] = useState('');
  const [idNumber, setIdNumber] = useState('');

  // Auto-set read-only current date & time on modal open
  useEffect(() => {
    if (showCreateModal) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setCurrentDateTime(formatted);
    }
  }, [showCreateModal]);

  // Inventory available for selection (strictly real stock)
  const availableInventory = useMemo(() => {
    if (stock && stock.length > 0) {
      return stock.map((s) => ({
        stock_id: s.stock_id,
        medicine_id: s.medicine_id,
        name: s.name || s.medicine?.name || s.medicine_name || 'Medicine',
        category: s.category || s.medicine?.category || 'General',
        price: Number(s.price || 45.0),
        available_qty: Number(s.quantity || 0),
        batch_number: s.batch_number || '',
      }));
    }
    return [];
  }, [stock]);

  // Overall totals across all order items
  const totalActualPrice = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (Number(item.actual_price) || 0), 0);
  }, [orderItems]);

  const totalFinalPrice = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (Number(item.final_price) || 0), 0);
  }, [orderItems]);

  const totalDiscount = useMemo(() => {
    return Math.max(0, totalActualPrice - totalFinalPrice);
  }, [totalActualPrice, totalFinalPrice]);

  const discountPercentage = useMemo(() => {
    if (totalActualPrice <= 0 || totalDiscount <= 0) return 0;
    return Math.round((totalDiscount / totalActualPrice) * 100);
  }, [totalActualPrice, totalDiscount]);

  // Helpers to manipulate multi-item rows
  const handleAddItem = () => {
    setOrderItems((prev) => [...prev, createEmptyItem(prev.length)]);
  };

  const handleRemoveItem = (itemId) => {
    if (orderItems.length <= 1) return;
    setOrderItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleItemSelectMedicine = (itemId, stockItem) => {
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const q = Math.max(1, Number(it.quantity) || 1);
        const uPrice = Number(stockItem.price || 0);
        const actPrice = Math.round(q * uPrice * 100) / 100;
        return {
          ...it,
          stock_id: stockItem.stock_id,
          medicine_id: stockItem.medicine_id,
          medicine_name: stockItem.name,
          searchQuery: stockItem.name,
          available_qty: Number(stockItem.available_qty ?? 0),
          unit_price: uPrice,
          actual_price: actPrice,
          final_price: it.isFinalPriceEdited ? it.final_price : actPrice,
          isDropdownOpen: false,
        };
      })
    );
  };

  const handleItemQuantityChange = (itemId, nextQty) => {
    const q = Math.max(1, Number(nextQty) || 1);
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const actPrice = Math.round(q * Number(it.unit_price || 0) * 100) / 100;
        return {
          ...it,
          quantity: q,
          actual_price: actPrice,
          final_price: it.isFinalPriceEdited ? it.final_price : actPrice,
        };
      })
    );
  };

  const handleItemFinalPriceChange = (itemId, nextFinalPrice) => {
    const p = Math.max(0, Number(nextFinalPrice) || 0);
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          final_price: p,
          isFinalPriceEdited: true,
        };
      })
    );
  };

  const handleItemSearchChange = (itemId, query) => {
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          searchQuery: query,
          isDropdownOpen: true,
        };
      })
    );
  };

  const handleItemToggleDropdown = (itemId, isOpen) => {
    setOrderItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, isDropdownOpen: isOpen } : it))
    );
  };

  // Reset form
  const resetCreateForm = () => {
    setCitizenName('');
    setPhoneNumber('');
    setAge('');
    setOrderStatus('confirm');
    setOrderItems([createEmptyItem(0)]);
    setHasCitizenId(false);
    setIdType('Aadhar Card');
    setOtherIdName('');
    setIdNumber('');
  };

  // Submit new order
  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();

    if (!citizenName.trim()) {
      alert('Please enter Citizen Name');
      return;
    }
    if (!phoneNumber.trim()) {
      alert('Please enter Phone Number');
      return;
    }
    if (!age || Number(age) <= 0) {
      alert('Please enter a valid Citizen Age');
      return;
    }

    // Validate that each item has a medicine
    for (let i = 0; i < orderItems.length; i++) {
      const it = orderItems[i];
      if (!it.medicine_name.trim() && !it.searchQuery.trim()) {
        alert(`Please select a medicine for item #${i + 1}`);
        return;
      }
    }

    const resolvedItems = orderItems.map((it) => {
      let matchedStock = null;
      if (!it.stock_id && it.searchQuery) {
        matchedStock = availableInventory.find(
          (inv) => inv.name.toLowerCase() === it.searchQuery.trim().toLowerCase()
        );
      }
      return {
        stock_id: it.stock_id || matchedStock?.stock_id || '',
        medicine_id: it.medicine_id || matchedStock?.medicine_id || 'MED-GEN',
        medicine_name: it.medicine_name || matchedStock?.name || it.searchQuery.trim(),
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price || matchedStock?.price || 0),
        actual_price: Number(it.actual_price) || 0,
        final_price: Number(it.final_price !== undefined ? it.final_price : it.actual_price) || 0,
      };
    });

    let resolvedIdType = '';
    if (hasCitizenId) {
      resolvedIdType = idType === 'Other' ? `Other: ${otherIdName.trim() || 'Custom ID'}` : idType;
    }

    const payload = {
      provider_id: pharmacyProfile?.provider_id || 'PROV-PHM-001',
      citizen_name: citizenName.trim(),
      citizen_phone: phoneNumber.trim(),
      citizen_age: Number(age),
      items: resolvedItems,
      total_quantity: resolvedItems.reduce((acc, it) => acc + it.quantity, 0),
      total_actual_price: Math.round(totalActualPrice * 100) / 100,
      total_final_price: Math.round(totalFinalPrice * 100) / 100,
      total_discount: Math.round(totalDiscount * 100) / 100,
      order_datetime: currentDateTime,
      has_citizen_id: hasCitizenId,
      citizen_id_type: resolvedIdType,
      citizen_id_number: hasCitizenId ? idNumber.trim() : '',
      status: (orderStatus || 'confirm').toLowerCase(),
    };

    const res = await createOrder(payload);
    if (res.success) {
      setShowCreateModal(false);
      resetCreateForm();
      const isConfirmed = (orderStatus || 'confirm').toLowerCase() === 'confirm';
      setToastMessage(
        isConfirmed
          ? '✓ Order created and confirmed! Purchased quantities have been deducted from inventory stock.'
          : '✓ Order created in pending status. Inventory stock will be deducted when the order is confirmed.'
      );
      setTimeout(() => setToastMessage(''), 7000);
    }
  };

  // Quick Direct Actions for 'pending' orders (affects ONLY the clicked order)
  const handleDirectConfirm = async (orderId) => {
    try {
      setProcessingOrderId(orderId);
      setProcessingAction('confirm');
      await updateOrderStatus(orderId, 'confirm');
      setToastMessage(`✓ Order #${orderId} confirmed! Stock quantities deducted from inventory.`);
      setTimeout(() => setToastMessage(''), 7000);
    } finally {
      setProcessingOrderId(null);
      setProcessingAction(null);
    }
  };

  const handleDirectCancel = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this pending order?')) {
      try {
        setProcessingOrderId(orderId);
        setProcessingAction('cancel');
        await updateOrderStatus(orderId, 'cancelled');
        setToastMessage(`✓ Order #${orderId} cancelled.`);
        setTimeout(() => setToastMessage(''), 5000);
      } finally {
        setProcessingOrderId(null);
        setProcessingAction(null);
      }
    }
  };

  // Edit Confirmed Order Modal Submit
  const handleSaveEditOrder = async (e) => {
    e.preventDefault();
    if (!editOrderModal) return;

    const newStatus = editOrderModal.status.toLowerCase();
    const wasConfirmed = (editOrderModal.initial_status || editOrderModal.status).toLowerCase() === 'confirm';
    const isNowConfirmed = newStatus === 'confirm';

    await editOrder(editOrderModal.order_id, {
      status: newStatus,
      total_final_price: Number(editOrderModal.total_final_price || editOrderModal.final_price || 0),
      final_price: Number(editOrderModal.total_final_price || editOrderModal.final_price || 0),
    });

    if (!wasConfirmed && isNowConfirmed) {
      setToastMessage(`✓ Order #${editOrderModal.order_id} confirmed! Stock quantities deducted from inventory.`);
    } else if (wasConfirmed && !isNowConfirmed) {
      setToastMessage(`✓ Order #${editOrderModal.order_id} status updated! Stock quantities returned back to inventory.`);
    } else {
      setToastMessage(`✓ Order #${editOrderModal.order_id} details updated successfully.`);
    }
    setTimeout(() => setToastMessage(''), 7000);

    setEditOrderModal(null);
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      const status = (order.status || 'pending').toLowerCase();
      const matchesStatus = filterStatus === 'ALL' || status === filterStatus.toLowerCase();

      const term = searchTerm.toLowerCase();
      const citizen = (order.citizen_name || '').toLowerCase();
      const phone = (order.citizen_phone || '').toLowerCase();
      const ordId = (order.order_id || '').toLowerCase();
      const medSummary = (order.medicine_name || '').toLowerCase();
      const itemMatch = (order.items || []).some((it) =>
        (it.medicine_name || '').toLowerCase().includes(term)
      );

      const matchesSearch =
        !term ||
        citizen.includes(term) ||
        phone.includes(term) ||
        ordId.includes(term) ||
        medSummary.includes(term) ||
        itemMatch;

      return matchesStatus && matchesSearch;
    });
  }, [orders, filterStatus, searchTerm]);

  // Counts for tabs
  const orderCounts = useMemo(() => {
    const list = orders || [];
    return {
      all: list.length,
      pending: list.filter((o) => (o.status || '').toLowerCase() === 'pending').length,
      confirm: list.filter((o) => (o.status || '').toLowerCase() === 'confirm').length,
      cancelled: list.filter((o) => (o.status || '').toLowerCase() === 'cancelled').length,
      return: list.filter((o) => (o.status || '').toLowerCase() === 'return').length,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Orders & Billing Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create multi-item citizen dispensary orders, apply customized bill pricing, and track dispensation status.
          </p>
        </div>

        <button
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer self-start md:self-auto"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Order</span>
        </button>
      </div>

      {/* Instant Feedback Toast Banner */}
      {toastMessage && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/80 p-3.5 px-4 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <span className="text-base text-emerald-600 dark:text-emerald-400">✓</span>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control Toolbar: Status Filter Tabs & Search */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Orders ({orderCounts.all})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Pending ({orderCounts.pending})
          </button>
          <button
            onClick={() => setFilterStatus('confirm')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'confirm'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Confirmed ({orderCounts.confirm})
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'cancelled'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Cancelled ({orderCounts.cancelled})
          </button>
          <button
            onClick={() => setFilterStatus('return')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'return'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            Returned ({orderCounts.return})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[280px] md:w-80">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by Citizen, Phone, Medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Orders List / Grid */}
      {loading && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500">
          Loading pharmacy orders...
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Orders Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || filterStatus !== 'ALL'
              ? 'No orders match your filter criteria. Try clearing filters or search terms.'
              : 'No orders have been recorded yet. Click "Create New Order" above to add the first order.'}
          </p>
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const statusKey = (order.status || 'pending').toLowerCase();
            const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
            const isPending = statusKey === 'pending';
            const isConfirm = statusKey === 'confirm';

            const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
              {
                medicine_name: order.medicine_name || 'Prescription Medicine',
                quantity: order.quantity || 1,
                actual_price: order.actual_price || 0,
                final_price: order.final_price || order.actual_price || 0,
              }
            ];

            const totalAct = Number(order.total_actual_price !== undefined ? order.total_actual_price : (order.actual_price || 0));
            const totalFin = Number(order.total_final_price !== undefined ? order.total_final_price : (order.final_price || order.actual_price || 0));
            const totalDisc = Math.max(0, totalAct - totalFin);

            return (
              <div
                key={order.order_id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {order.order_id}
                      </span>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{order.order_datetime || 'Recent'}</span>
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.indicator}`}></span>
                      {config.label}
                    </span>
                  </div>

                  {/* Citizen Information */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 mb-3 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Citizen:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {order.citizen_name} <span className="font-normal text-slate-400">({order.citizen_age} yrs)</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{order.citizen_phone || '—'}</span>
                    </div>

                    {order.has_citizen_id && order.citizen_id_number && (
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                          {order.citizen_id_type || 'ID'}:
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {order.citizen_id_number}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Purchased Medicine Line Items */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 mb-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                      <span>Purchased Products ({items.length})</span>
                      <span>Qty • Price</span>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]" title={item.medicine_name}>
                            • {item.medicine_name}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {item.quantity} × ₹{Number(item.final_price || item.actual_price || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billing Totals & Discount Breakdown */}
                  <div className="space-y-1.5 text-xs mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>Total Actual Price:</span>
                      <span className="font-mono font-medium">₹{totalAct.toFixed(2)}</span>
                    </div>

                    {totalDisc > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                        <span>Discount Applied:</span>
                        <span className="font-semibold">-₹{totalDisc.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-900 dark:text-white">Total Amount:</span>
                      <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                        ₹{totalFin.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Section based on Order Status */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* PENDING: Show direct Confirm and Cancel buttons */}
                  {isPending && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDirectConfirm(order.order_id)}
                        disabled={processingOrderId === order.order_id}
                        className="py-2 px-3 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>
                          {processingOrderId === order.order_id && processingAction === 'confirm'
                            ? 'Confirming...'
                            : 'Confirm'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDirectCancel(order.order_id)}
                        disabled={processingOrderId === order.order_id}
                        className="py-2 px-3 rounded-xl font-semibold text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>
                          {processingOrderId === order.order_id && processingAction === 'cancel'
                            ? 'Cancelling...'
                            : 'Cancel'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* CONFIRMED: Direct buttons hidden, open Edit Dialogue Box to change status */}
                  {isConfirm && (
                    <button
                      onClick={() =>
                        setEditOrderModal({
                          ...order,
                          initial_status: order.status || 'confirm',
                          status: order.status || 'confirm',
                          total_final_price: totalFin,
                          final_price: totalFin,
                        })
                      }
                      className="w-full py-2 px-3 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Order Status</span>
                    </button>
                  )}

                  {/* CANCELLED or RETURNED */}
                  {!isPending && !isConfirm && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 italic">
                        {statusKey === 'return' ? 'Order processed as Returned' : 'Order marked as Cancelled'}
                      </span>
                      <button
                        onClick={() =>
                          setEditOrderModal({
                            ...order,
                            initial_status: order.status,
                            status: order.status,
                            total_final_price: totalFin,
                            final_price: totalFin,
                          })
                        }
                        className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                      >
                        Modify
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MULTI-ITEM ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl text-slate-900 dark:text-white my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Pharmacy Order</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Add multiple medicines, configure quantities and prices, and generate citizen order records.
            </p>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-5">
              {/* Top Order Status Selector (Default: Confirmed) & Order Time */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Initial Order Status:
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs cursor-pointer"
                  >
                    <option value="confirm">✓ Confirmed (Dispensed / Completed Sale)</option>
                    <option value="pending">⏳ Pending (Awaiting Dispensation)</option>
                    <option value="cancelled">✕ Cancelled (Void Order)</option>
                    <option value="return">↺ Returned (Medicine Returned)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>Order Time:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {currentDateTime}
                  </span>
                </div>
              </div>

              {/* Customer Info Section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  1. Citizen & Prescription Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Citizen Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kulkarni"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9822014523"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="125"
                      required
                      placeholder="e.g. 45"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Order Date & Time (Auto-filled)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={currentDateTime}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                {/* Optional Citizen ID */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasCitizenId}
                      onChange={(e) => setHasCitizenId(e.target.checked)}
                      className="w-4 h-4 accent-teal-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Do you want to add Citizen ID?
                    </span>
                  </label>

                  {hasCitizenId && (
                    <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Type of ID <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={idType}
                            onChange={(e) => setIdType(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            {ID_TYPE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {idType === 'Other' && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Specify Name of ID <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Ration Card, Driving License"
                              value={otherIdName}
                              onChange={(e) => setOtherIdName(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        )}

                        <div className={idType === 'Other' ? 'md:col-span-2' : ''}>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Citizen ID Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Enter identification number"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-Medicine Products Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    2. Select Medicines & Quantities ({orderItems.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition cursor-pointer"
                  >
                    <span>+ Add Another Medicine</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {orderItems.map((item, index) => {
                    // Filter inventory for this row's search
                    const filtered = !item.searchQuery
                      ? availableInventory
                      : availableInventory.filter(
                          (m) =>
                            m.name.toLowerCase().includes(item.searchQuery.toLowerCase()) ||
                            m.category.toLowerCase().includes(item.searchQuery.toLowerCase())
                        );

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 relative"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span>Product #{index + 1}</span>
                          {orderItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>

                        {/* Searchable Medicine Dropdown */}
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Type to search medicine in stock..."
                            value={item.searchQuery}
                            onFocus={() => handleItemToggleDropdown(item.id, true)}
                            onChange={(e) => handleItemSearchChange(item.id, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                          />

                          {item.isDropdownOpen && (
                            <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xl">
                              {availableInventory.length === 0 ? (
                                <div className="p-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                                  No medicines currently in stock. Please add products in <span className="font-semibold text-teal-600 dark:text-teal-400">Medicine Inventory</span> first.
                                </div>
                              ) : filtered.length === 0 ? (
                                <div className="p-2.5 text-xs text-slate-400 text-center">
                                  No medicines found matching "{item.searchQuery}"
                                </div>
                              ) : (
                                filtered.map((inv) => (
                                  <div
                                    key={inv.stock_id}
                                    onClick={() => handleItemSelectMedicine(item.id, inv)}
                                    className="p-2.5 hover:bg-teal-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <span className="font-bold text-slate-900 dark:text-white">{inv.name}</span>
                                      <span className="text-slate-400 ml-1">({inv.category})</span>
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                        Batch: {inv.batch_number || 'GEN'} • In Stock: <span className="font-semibold text-teal-600">{inv.available_qty}</span>
                                      </div>
                                    </div>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                      ₹{inv.price.toFixed(2)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quantity, Actual Price (Auto), Final Price (Editable) */}
                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                Quantity <span className="text-red-500">*</span>
                              </label>
                              {item.available_qty !== undefined && (
                                <span
                                  className={`text-[10px] font-bold ${
                                    item.quantity > item.available_qty
                                      ? 'text-rose-500'
                                      : item.available_qty <= 10
                                      ? 'text-amber-500'
                                      : 'text-teal-600 dark:text-teal-400'
                                  }`}
                                  title="Current quantity available in inventory stock"
                                >
                                  Stock: {item.available_qty}
                                </span>
                              )}
                            </div>
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => handleItemQuantityChange(item.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            {item.available_qty !== undefined && item.quantity > item.available_qty && (
                              <span className="block text-[10px] text-rose-500 font-bold mt-0.5">
                                ⚠️ Exceeds stock ({item.available_qty})
                              </span>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Actual Price (₹)
                            </label>
                            <input
                              type="number"
                              readOnly
                              value={Number(item.actual_price || 0).toFixed(2)}
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono cursor-not-allowed font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Final Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={item.final_price}
                              onChange={(e) => handleItemFinalPriceChange(item.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Total Price & Discounts Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-800/60 dark:to-teal-950/20 border border-teal-500/20 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Total Actual Price
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                      ₹{totalActualPrice.toFixed(2)}
                    </span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="sm:text-center">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                        Total Discount
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        -₹{totalDiscount.toFixed(2)} ({discountPercentage}% off)
                      </span>
                    </div>
                  )}

                  <div className="sm:text-right">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Total Final Price (To Pay)
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{totalFinalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={mutating}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {mutating ? 'Saving Order...' : 'Create Order Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ORDER DIALOG BOX */}
      {editOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl text-slate-900 dark:text-white my-8">
            <button
              onClick={() => setEditOrderModal(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Modify Order Lifecycle</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Change status for order <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{editOrderModal.order_id}</span>
            </p>

            <form onSubmit={handleSaveEditOrder} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Citizen:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{editOrderModal.citizen_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Medicines:</span>
                  <span className="font-semibold text-teal-600 truncate max-w-[200px]" title={editOrderModal.medicine_name}>
                    {editOrderModal.medicine_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Units:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{editOrderModal.quantity} units</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Update Order Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editOrderModal.status}
                  onChange={(e) => setEditOrderModal({ ...editOrderModal, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                >
                  <option value="confirm">Confirmed (Completed Sale)</option>
                  <option value="return">Return (Medicine Returned)</option>
                  <option value="cancelled">Cancelled (Order Voided)</option>
                  <option value="pending">Pending (Awaiting Dispensation)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Note: Only 'Confirmed' orders are counted in active sales revenue and ledger.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Final Billed Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editOrderModal.total_final_price !== undefined ? editOrderModal.total_final_price : editOrderModal.final_price || ''}
                  onChange={(e) =>
                    setEditOrderModal({
                      ...editOrderModal,
                      total_final_price: e.target.value,
                      final_price: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditOrderModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutating}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {mutating ? 'Saving...' : 'Save Order Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
