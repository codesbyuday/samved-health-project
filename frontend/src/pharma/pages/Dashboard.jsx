import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const DashboardCard = ({ title, value, icon, tone, link, helper }) => (
  <Link
    to={link}
    className="rounded-[1.5rem] p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-soft">{title}</p>
        <p className="mt-2 text-3xl font-extrabold text-main">{value}</p>
        <p className="mt-1 text-xs text-faint">{helper}</p>
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner" style={{ background: tone }}>
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
  const lowStockCount = stock.filter((item) => item.quantity <= item.threshold).length;
  const availableCount = stock.filter((item) => item.quantity > 0).length;
  const activeAlerts = alerts.length;
  const pendingOrders = orders.filter((item) => String(item.status).toLowerCase() === 'pending').length;
  const confirmedOrders = orders.filter((item) => String(item.status).toLowerCase() === 'confirm').length;

  const totalInventoryValuation = stock.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Pharmacy Identity Banner */}
      <div className="rounded-[2rem] p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="brand-mark flex h-16 w-16 items-center justify-center rounded-3xl text-2xl font-bold shadow-lg">
              {pharmacyProfile?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-main">{pharmacyProfile?.name || 'Pharmacy Clinical Workspace'}</h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  Verified Facility
                </span>
              </div>
              <p className="mt-1 text-sm text-soft">
                License: <span className="font-mono text-main">{pharmacyProfile?.license || 'MH-PHM-2022-0145'}</span> •{' '}
                Location: <span className="text-main">{pharmacyProfile?.address || 'Solapur'}</span> (
                <span className="text-[#47c2bf] font-medium">{pharmacyProfile?.ward || 'Ward 5'}</span>)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Est. Stock Valuation</p>
              <p className="mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{totalInventoryValuation.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data Connection</p>
              <p className="mt-0.5 font-bold uppercase tracking-[0.15em] text-teal-600 dark:text-teal-400 text-xs">
                {databaseMode === 'supabase' ? '● Live Supabase' : '● Connected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="surface-card rounded-2xl p-4 text-sm text-red-400 border border-red-500/20 bg-red-500/10">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <DashboardCard
          title="Tracked Medicines"
          value={loading ? '...' : totalMedicines}
          helper="Active pharmacy SKUs in inventory"
          icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          tone="var(--brand-soft)"
          link="/inventory"
        />
        <DashboardCard
          title="Low & Critical Stock"
          value={loading ? '...' : lowStockCount}
          helper="Items at or below reorder threshold"
          icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          tone="var(--warning-soft)"
          link="/rare-medicines"
        />
        <DashboardCard
          title="In-Stock Units"
          value={loading ? '...' : availableCount}
          helper="Medicines currently ready for sale"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          tone="var(--success-soft)"
          link="/inventory"
        />
        <DashboardCard
          title="Total Orders"
          value={loading ? '...' : orders.length}
          helper="All recorded client dispensary orders"
          icon="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          tone="rgba(104, 117, 245, 0.14)"
          link="/orders"
        />
        <DashboardCard
          title="Regional Health Alerts"
          value={loading ? '...' : activeAlerts}
          helper="SMC surveillance & outbreak advisories"
          icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          tone="var(--danger-soft)"
          link="/alerts"
        />
        <DashboardCard
          title="Pending Orders"
          value={loading ? '...' : pendingOrders}
          helper="Citizen pickup orders to fulfill"
          icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          tone="rgba(66, 135, 245, 0.14)"
          link="/orders"
        />
      </div>

      {/* Quick Action Tables Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock Watch */}
        <div className="rounded-[1.75rem] p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-main">Low Stock Attention</h3>
              <p className="text-xs text-soft">Items nearing or under safety threshold</p>
            </div>
            <Link to="/rare-medicines" className="text-xs text-[#47c2bf] font-medium hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {stock.filter((s) => s.quantity <= s.threshold).length === 0 ? (
              <p className="py-6 text-center text-xs text-soft">All medicine stocks are at healthy operating levels.</p>
            ) : (
              stock
                .filter((s) => s.quantity <= s.threshold)
                .slice(0, 4)
                .map((item) => (
                  <div key={item.stock_id} className="surface-muted flex items-center justify-between rounded-2xl p-3">
                    <div>
                      <p className="font-semibold text-main text-sm">{item.name || 'Medicine'}</p>
                      <p className="text-xs text-faint">
                        Batch: {item.batch_number} • Price: ₹{(Number(item.price) || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-red-400">
                        {item.quantity} / {item.threshold} min
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Recent Health Advisories */}
        <div className="rounded-[1.75rem] p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-main">Public Health Broadcasts</h3>
              <p className="text-xs text-soft">Solapur Municipal Corporation advisories</p>
            </div>
            <Link to="/alerts" className="text-xs text-[#47c2bf] font-medium hover:underline">
              View Alerts →
            </Link>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="py-6 text-center text-xs text-soft">No active public health alerts.</p>
            ) : (
              alerts.slice(0, 3).map((alert) => (
                <div key={alert.alert_id} className="surface-muted rounded-2xl p-3 border-l-4 border-amber-400">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-main uppercase tracking-wider">{alert.type}</span>
                    <span className="text-[11px] text-faint">{alert.ward}</span>
                  </div>
                  <p className="mt-1 text-xs text-soft line-clamp-2">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
