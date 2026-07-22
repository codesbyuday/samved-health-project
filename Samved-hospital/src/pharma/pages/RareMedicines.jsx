import React from 'react';
import { useData } from '../context/DataContext';

const RareMedicines = () => {
  const { stock, medicines, loading } = useData();

  const getMedicine = (medicineId) => medicines.find((item) => item.medicine_id === medicineId) || {};
  const rareItems = stock.filter((item) => item.quantity <= item.threshold);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Rare and Critical Stock</h1>
        <p className="page-subtitle">Items requiring immediate restocking attention.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading && <div className="surface-card rounded-3xl p-6 text-soft">Loading critical stock...</div>}

        {!loading && rareItems.length === 0 && <div className="surface-card rounded-3xl p-6 text-soft">No critical stock items right now.</div>}

        {rareItems.map((item) => {
          const medicine = getMedicine(item.medicine_id);

          return (
            <div key={item.stock_id} className="surface-card overflow-hidden rounded-[1.5rem]">
              <div className="h-2" style={{ background: 'linear-gradient(90deg, #d95757 0%, #f0b24f 100%)' }}></div>
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-main">{medicine.name || 'Unknown'}</h3>
                    <p className="text-xs uppercase tracking-[0.18em] text-faint">{medicine.category || 'N/A'}</p>
                  </div>
                  <span className="status-pill" style={{ background: 'var(--danger-soft)', color: '#d95757' }}>
                    Critical
                  </span>
                </div>

                <div className="flex items-end justify-between border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-xs text-faint">Available</p>
                    <p className="text-3xl font-bold text-main">{item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-faint">Minimum</p>
                    <p className="text-lg font-bold text-soft">{item.threshold}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RareMedicines;
