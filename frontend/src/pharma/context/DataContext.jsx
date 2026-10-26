import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  addInventoryItem,
  createPharmacyOrder,
  editPharmacyOrder,
  fetchAppData,
  isSupabaseConfigured,
  removeInventoryItem,
  updateInventoryItem,
  updatePharmacyOrderStatus,
} from '../lib/database';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { session, user, pharmacyProfile } = useAuth();
  const [data, setData] = useState({
    medicines: [],
    stock: [],
    healthRecords: [],
    alerts: [],
    notifications: [],
    orders: [],
    sales: [],
  });
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState('');

  async function loadData() {
    if (!user || !pharmacyProfile) {
      setData({
        medicines: [],
        stock: [],
        healthRecords: [],
        alerts: [],
        notifications: [],
        orders: [],
        sales: [],
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextData = await fetchAppData(session, pharmacyProfile.provider_id);
      setData(nextData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user, pharmacyProfile?.provider_id]);

  async function runMutation(task) {
    setMutating(true);
    setError('');

    try {
      await task();
      await loadData();
      return { success: true };
    } catch (mutationError) {
      setError(mutationError.message);
      return { success: false, error: mutationError.message };
    } finally {
      setMutating(false);
    }
  }

  const value = {
    ...data,
    loading,
    mutating,
    error,
    databaseMode: isSupabaseConfigured() ? 'supabase' : 'mock',
    refreshData: loadData,
    createStockItem: (payload) => runMutation(() => addInventoryItem(payload, session)),
    saveStockItem: (stockId, values) => runMutation(() => updateInventoryItem(stockId, values, session)),
    deleteStockItem: (stockId) => runMutation(() => removeInventoryItem(stockId, session)),
    createOrder: (payload) => runMutation(() => createPharmacyOrder(payload, session)),
    updateOrderStatus: (orderId, status) => runMutation(() => updatePharmacyOrderStatus(orderId, status, session)),
    saveOrderStatus: (orderId, status) => runMutation(() => updatePharmacyOrderStatus(orderId, status, session)),
    editOrder: (orderId, updates) => runMutation(() => editPharmacyOrder(orderId, updates, session)),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
