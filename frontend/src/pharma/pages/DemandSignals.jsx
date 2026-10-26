import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const DemandSignals = () => {
  const { pharmacyProfile } = useAuth();
  const { stock, medicines, loading } = useData();

  const demandData = (stock || [])
    .map((item) => {
      const medicine = medicines.find((entry) => entry.medicine_id === item.medicine_id) || {};
      const name = medicine.name || medicine.medicine_name || item.name || 'Unknown Medicine';
      const category = medicine.category || medicine.medicine_category || item.category || 'Therapeutic';
      
      const thresholdVal = Number(item.threshold || 10);
      const quantityVal = Number(item.quantity || 0);
      
      // Demand pressure increases when safety threshold is elevated or quantity is depleted
      const pressureRatio = thresholdVal > 0 ? Math.min(100, Math.round((thresholdVal / Math.max(1, quantityVal + thresholdVal)) * 100)) : 40;
      const demandLevel = pressureRatio > 70 ? 'High' : pressureRatio > 40 ? 'Medium' : 'Stable';

      return {
        name,
        category,
        demandLevel,
        percentage: pressureRatio,
        quantity: quantityVal,
        threshold: thresholdVal,
        ward: pharmacyProfile?.ward || 'Solapur City Ward',
      };
    })
    .filter((item) => item.demandLevel !== 'Stable');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Regional Demand Signals & Inventory Pressure</h1>
          <p className="page-subtitle">
            Algorithmic demand pressure calculated from consumption thresholds and regional disease surveillance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading && (
          <div className="surface-card col-span-2 rounded-3xl p-8 text-center text-soft">
            Analyzing demand signals...
          </div>
        )}

        {!loading && demandData.length === 0 && (
          <div className="surface-card col-span-2 rounded-3xl p-12 text-center text-soft">
            <p className="text-base font-bold text-main">Demand & Supply in Balance</p>
            <p className="mt-1 text-xs text-soft">No elevated consumption spikes detected across this pharmacy's catalog.</p>
          </div>
        )}

        {demandData.map((item, index) => (
          <div key={`${item.name}-${index}`} className="surface-card rounded-[1.75rem] p-6 border border-white/5 shadow-md">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-main text-base">{item.name}</h3>
                <p className="text-xs text-soft">{item.category}</p>
              </div>
              <span
                className="status-pill text-xs font-semibold"
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
              <span>
                Available: <strong className="text-main">{item.quantity}</strong> / Min Threshold: {item.threshold}
              </span>
            </div>

            <div className="surface-muted h-3.5 overflow-hidden rounded-full p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  background:
                    item.demandLevel === 'High'
                      ? 'linear-gradient(90deg, #d95757 0%, #f08f8f 100%)'
                      : 'linear-gradient(90deg, #d6940c 0%, #f0b24f 100%)',
                }}
              ></div>
            </div>

            <div className="mt-2 text-right">
              <span className="text-[11px] font-semibold text-faint">{item.percentage}% Stock Depletion Pressure</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemandSignals;
