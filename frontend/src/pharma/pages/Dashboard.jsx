import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const DashboardCard = ({ title, value, icon, tone, link, helper }) => (
  <Link to={link} className="surface-card rounded-[1.5rem] p-6 transition-transform duration-200 hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-soft">{title}</p>
        <p className="mt-2 text-3xl font-bold text-main">{value}</p>
        <p className="mt-1 text-sm text-faint">{helper}</p>
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: tone }}>
        <svg className="h-6 w-6 text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  const { pharmacyProfile } = useAuth();
  const { stock, healthRecords, alerts, orders, loading, error, databaseMode } = useData();

  const totalMedicines = stock.length;
  const lowStockCount = stock.filter((item) => item.quantity < item.threshold).length;
  const availableCount = stock.filter((item) => item.quantity > 0).length;
  const pendingPrescriptions = healthRecords.filter((item) => !item.verified).length;
  const activeAlerts = alerts.length;
  const pendingOrders = orders.filter((item) => item.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="surface-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="brand-mark flex h-16 w-16 items-center justify-center rounded-3xl text-2xl font-bold">
              {pharmacyProfile?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-main">{pharmacyProfile?.name}</h2>
              <p className="mt-1 text-soft">
                License: {pharmacyProfile?.license} | Ward: {pharmacyProfile?.ward}
              </p>
            </div>
          </div>

          <div className="surface-card rounded-3xl px-4 py-3 text-sm">
            <p className="text-faint">Active data source</p>
            <p className="mt-1 font-semibold uppercase tracking-[0.18em] text-main">{databaseMode}</p>
          </div>
        </div>
      </div>

      {error && <div className="surface-card rounded-3xl p-4 text-sm text-red-500">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <DashboardCard title="Tracked Medicines" value={loading ? '...' : totalMedicines} helper="Inventory records loaded" icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" tone="var(--brand-soft)" link="/inventory" />
        <DashboardCard title="Low Stock" value={loading ? '...' : lowStockCount} helper="Needs replenishment attention" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" tone="var(--warning-soft)" link="/rare-medicines" />
        <DashboardCard title="Available Stock" value={loading ? '...' : availableCount} helper="Items with quantity on hand" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" tone="var(--success-soft)" link="/inventory" />
        <DashboardCard title="Pending Prescriptions" value={loading ? '...' : pendingPrescriptions} helper="Awaiting verification" icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" tone="rgba(104, 117, 245, 0.14)" link="/prescriptions" />
        <DashboardCard title="Health Alerts" value={loading ? '...' : activeAlerts} helper="Regional and facility notices" icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" tone="var(--danger-soft)" link="/alerts" />
        <DashboardCard title="Pending Orders" value={loading ? '...' : pendingOrders} helper="Needs pharmacist action" icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" tone="rgba(66, 135, 245, 0.14)" link="/orders" />
      </div>
    </div>
  );
};

export default Dashboard;
