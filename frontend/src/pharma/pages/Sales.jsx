import React from 'react';
import { useData } from '../context/DataContext';

const Sales = () => {
  const { sales, loading } = useData();

  const totalRevenue = (sales || []).reduce(
    (sum, row) => sum + (Number(row.amount) || (Number(row.qty || 1) * 45)),
    0
  );
  const totalUnitsSold = (sales || []).reduce((sum, row) => sum + Number(row.qty || 0), 0);

  const salesByDate = (sales || []).reduce((acc, row) => {
    const d = row.date || 'Recent';
    acc[d] = (acc[d] || 0) + Number(row.qty || 0);
    return acc;
  }, {});

  const topSelling = Object.entries(
    (sales || []).reduce((acc, row) => {
      const med = row.med || 'Unknown';
      acc[med] = (acc[med] || 0) + Number(row.qty || 0);
      return acc;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  const maxSales = Math.max(...Object.values(salesByDate), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Pharmacy Sales & Dispensation Records</h1>
          <p className="page-subtitle">
            Track revenue, volume, and prescription sales ledger for your pharmacy location.
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Total Revenue</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Recorded across fulfilled orders</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Total Units Dispensed</p>
          <p className="mt-2 text-3xl font-extrabold text-teal-600 dark:text-teal-400">{totalUnitsSold}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Medicine packets & doses</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Sales Transactions</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{(sales || []).length}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Completed client fulfillments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Volume Chart */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 lg:col-span-2 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Sales Volume Trend (Units per Day)</h3>
          <div className="mt-6 flex h-48 items-end space-x-4 md:space-x-6 overflow-x-auto pb-2">
            {loading && <div className="text-slate-400 text-sm">Loading sales analytics...</div>}
            {!loading &&
              Object.entries(salesByDate).map(([date, quantity]) => (
                <div key={date} className="group flex flex-1 flex-col items-center min-w-[50px]">
                  <div className="text-xs text-teal-600 dark:text-teal-400 font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {quantity}
                  </div>
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t-xl transition-all duration-500 shadow-md"
                      style={{
                        height: `${Math.min(140, Math.max(16, (quantity / maxSales) * 130))}px`,
                        background: 'linear-gradient(180deg, #14b8a6 0%, #0d9488 100%)',
                      }}
                    ></div>
                  </div>
                  <span className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400 truncate w-full text-center">
                    {date.slice(5)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Top Dispensed Medicines</h3>
          <div className="mt-4 space-y-3">
            {topSelling.length === 0 && <p className="text-slate-400 text-xs">No sales recorded yet.</p>}
            {topSelling.map(([medicine, quantity], index) => (
              <div key={medicine} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    #{index + 1} {medicine}
                  </span>
                </div>
                <span className="font-extrabold text-teal-600 dark:text-teal-400 text-sm">{quantity} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Records Ledger */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 p-4 px-6 bg-slate-50 dark:bg-slate-800/80">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Detailed Dispensation Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Transaction ID</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Medicine Dispensed</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Units</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Date</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Citizen / Recipient</th>
                <th className="py-4 px-5 text-right text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading sales ledger...
                  </td>
                </tr>
              )}

              {!loading && (sales || []).length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No sales transactions found.
                  </td>
                </tr>
              )}

              {(sales || []).map((row, idx) => (
                <tr key={row.sale_id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{row.sale_id || `TX-${1000 + idx}`}</td>
                  <td className="py-4 px-4 font-bold text-slate-900 dark:text-white text-sm">{row.med}</td>
                  <td className="py-4 px-4 font-extrabold text-teal-600 dark:text-teal-400 text-sm">{row.qty}</td>
                  <td className="py-4 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">{row.date}</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-800 dark:text-slate-200">{row.citizen || 'Walk-in Patient'}</td>
                  <td className="py-4 px-5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-base font-mono">
                    ₹{(Number(row.amount) || Number(row.qty || 1) * 45).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
