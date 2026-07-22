import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const DemandSignals = () => {
  const { pharmacyProfile } = useAuth();
  const { stock, medicines, loading } = useData();

  const demandData = stock
    .map((item) => {
      const medicine = medicines.find((entry) => entry.medicine_id === item.medicine_id);
      const demandLevel = item.threshold > 15 ? 'High' : item.threshold > 5 ? 'Medium' : 'Low';
      const percentage = item.threshold > 15 ? 90 : item.threshold > 5 ? 62 : 34;

      return {
        name: medicine?.name || 'Unknown',
        demandLevel,
        percentage,
        ward: pharmacyProfile?.ward || 'Unassigned ward',
      };
    })
    .filter((item) => item.demandLevel !== 'Low');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Demand Signals</h1>
        <p className="page-subtitle">A simple operational view built from threshold pressure in the connected stock data.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading && <div className="surface-card rounded-3xl p-6 text-soft">Loading demand indicators...</div>}

        {!loading && demandData.length === 0 && <div className="surface-card rounded-3xl p-6 text-soft">No elevated demand signals right now.</div>}

        {demandData.map((item, index) => (
          <div key={`${item.name}-${index}`} className="surface-card rounded-[1.5rem] p-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="font-bold text-main">{item.name}</h3>
              <span
                className="status-pill"
                style={{
                  background: item.demandLevel === 'High' ? 'var(--danger-soft)' : 'var(--warning-soft)',
                  color: item.demandLevel === 'High' ? '#d95757' : '#b7791f',
                }}
              >
                {item.demandLevel} Demand
              </span>
            </div>

            <div className="mb-2 flex justify-between text-xs text-soft">
              <span>{item.ward}</span>
              <span>{item.percentage}% pressure</span>
            </div>

            <div className="surface-muted h-3 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${item.percentage}%`,
                  background:
                    item.demandLevel === 'High'
                      ? 'linear-gradient(90deg, #d95757 0%, #f08f8f 100%)'
                      : 'linear-gradient(90deg, #d6940c 0%, #f0b24f 100%)',
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemandSignals;
