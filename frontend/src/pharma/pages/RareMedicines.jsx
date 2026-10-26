import React from 'react';
import { useData } from '../context/DataContext';

const RareMedicines = () => {
  const { stock, medicines, loading, mutating, saveStockItem } = useData();

  const getMedicine = (medicineId) => medicines.find((item) => item.medicine_id === medicineId) || {};
  const rareItems = stock.filter((item) => item.quantity <= item.threshold);

  const handleRestock = async (item, addQuantity = 50) => {
    await saveStockItem(item.stock_id, {
      quantity: Number(item.quantity || 0) + addQuantity,
      threshold: item.threshold,
      price: item.price,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Low & Critical Stock Management</h1>
          <p className="page-subtitle">
            Medicines that have fallen below safety inventory reorder thresholds or are running out of stock.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <div className="col-span-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
            Loading critical stock levels...
          </div>
        )}

        {!loading && rareItems.length === 0 && (
          <div className="col-span-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">All Stock Levels Healthy</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              No medicines currently below their minimum threshold at this pharmacy location.
            </p>
          </div>
        )}

        {rareItems.map((item) => {
          const medicine = getMedicine(item.medicine_id);
          const medName = medicine.name || medicine.medicine_name || item.name || 'Unknown';
          const medCat = medicine.category || medicine.medicine_category || item.category || 'General';
          const isOut = item.quantity === 0;

          return (
            <div key={item.stock_id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div
                  className="h-2"
                  style={{
                    background: isOut
                      ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                  }}
                ></div>
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{medName}</h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold mt-0.5">{medCat}</p>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">Batch: {item.batch_number || 'N/A'}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isOut
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOut ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                      {isOut ? 'Out of Stock' : 'Critical Stock'}
                    </span>
                  </div>

                  <div className="flex items-end justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Available Units</p>
                      <p className={`text-3xl font-extrabold ${isOut ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-medium">Safety Threshold</p>
                      <p className="text-base font-bold text-slate-700 dark:text-slate-300">{item.threshold} units</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono mt-0.5">
                        ₹{(Number(item.price) || 0).toFixed(2)}/unit
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  type="button"
                  onClick={() => handleRestock(item, 50)}
                  disabled={mutating}
                  className="w-full py-2.5 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md transition cursor-pointer disabled:opacity-60"
                >
                  {mutating ? 'Updating...' : '+ Restock +50 Units'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RareMedicines;
