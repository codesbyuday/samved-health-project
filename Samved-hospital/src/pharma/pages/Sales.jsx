import React from 'react';
import { useData } from '../context/DataContext';

const Sales = () => {
  const { sales, loading } = useData();

  const salesByDate = sales.reduce((accumulator, currentRow) => {
    accumulator[currentRow.date] = (accumulator[currentRow.date] || 0) + Number(currentRow.qty || 0);
    return accumulator;
  }, {});

  const topSelling = Object.entries(
    sales.reduce((accumulator, currentRow) => {
      accumulator[currentRow.med] = (accumulator[currentRow.med] || 0) + Number(currentRow.qty || 0);
      return accumulator;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);

  const maxSales = Math.max(...Object.values(salesByDate), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Sales Analytics</h1>
        <p className="page-subtitle">Live sales data when available, with completed-order fallback when the sales table is absent.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="surface-card rounded-[1.5rem] p-6 lg:col-span-2">
          <h3 className="font-semibold text-main">Sales Volume</h3>
          <div className="mt-6 flex h-48 items-end space-x-6">
            {loading && <div className="text-soft">Loading sales...</div>}
            {!loading &&
              Object.entries(salesByDate).map(([date, quantity]) => (
                <div key={date} className="group flex flex-1 flex-col items-center">
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t-2xl transition-all duration-500"
                      style={{
                        height: `${(quantity / maxSales) * 120}px`,
                        minHeight: '12px',
                        background: 'linear-gradient(180deg, #42c7c0 0%, #127c7d 100%)',
                      }}
                    ></div>
                  </div>
                  <span className="mt-3 text-xs font-medium text-soft">{date}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="surface-card rounded-[1.5rem] p-6">
          <h3 className="font-semibold text-main">Top Selling</h3>
          <div className="mt-4 space-y-4">
            {topSelling.length === 0 && <p className="text-soft">No sales yet.</p>}
            {topSelling.map(([medicine, quantity], index) => (
              <div key={medicine} className="surface-muted rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-main">
                    {index + 1}. {medicine}
                  </span>
                  <span className="font-bold text-main">{quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden rounded-[1.5rem]">
        <div className="border-b p-4" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-main">Detailed Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-shell">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Date</th>
                <th>Citizen</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="4" className="empty-state">
                    Loading detailed sales records...
                  </td>
                </tr>
              )}

              {!loading && sales.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-state">
                    No sales records found.
                  </td>
                </tr>
              )}

              {sales.map((row) => (
                <tr key={row.sale_id || `${row.med}-${row.date}-${row.citizen}`}>
                  <td className="font-medium text-main">{row.med}</td>
                  <td className="font-bold text-main">{row.qty}</td>
                  <td className="text-soft">{row.date}</td>
                  <td className="text-soft">{row.citizen}</td>
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
