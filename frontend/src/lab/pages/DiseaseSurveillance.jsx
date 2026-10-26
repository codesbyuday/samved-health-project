import React, { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';

const DiseaseSurveillance = () => {
  const { diseaseCases } = useAppData();
  const [search, setSearch] = useState('');

  const cards = useMemo(() => {
    const grouped = diseaseCases.reduce((accumulator, item) => {
      const key = item.diseases?.disease_name || 'Unspecified Condition';
      const category = item.diseases?.disease_category || item.diseases?.disease_type || 'Infectious';
      if (!accumulator[key]) {
        accumulator[key] = {
          disease: key,
          category,
          cases: 0,
          highSeverity: 0,
          activeCases: 0,
          wards: new Set(),
        };
      }

      accumulator[key].cases += 1;
      if (item.citizens?.ward_number) {
        accumulator[key].wards.add(item.citizens.ward_number);
      }
      if (item.severity?.toLowerCase() === 'high') {
        accumulator[key].highSeverity += 1;
      }
      if (item.status?.toLowerCase() === 'active' || item.status?.toLowerCase() === 'under_treatment') {
        accumulator[key].activeCases += 1;
      }

      return accumulator;
    }, {});

    return Object.values(grouped).map((item) => ({
      ...item,
      risk: item.highSeverity > 2 ? 'High Risk' : item.highSeverity > 0 ? 'Moderate Alert' : 'Monitored',
      riskColor:
        item.highSeverity > 2
          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          : item.highSeverity > 0
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    }));
  }, [diseaseCases]);

  const filteredCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cards;
    return cards.filter(
      (c) => c.disease.toLowerCase().includes(term) || c.category.toLowerCase().includes(term),
    );
  }, [cards, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Municipal Epidemiology Watch
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Epidemic & Disease Surveillance
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Real-time public health disease monitoring aggregated across Solapur municipal wards to advise laboratory diagnostic readiness.
          </p>
        </div>
      </div>

      <div className="surface-card rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search infectious conditions (e.g. Dengue, Malaria, Typhoid, COVID-19)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => (
          <div key={card.disease} className="surface-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-700 dark:text-cyan-400">
                    {card.category}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {card.disease}
                  </h2>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${card.riskColor}`}>
                  {card.risk}
                </span>
              </div>

              <div className="my-4">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {card.cases}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-medium">Total Confirmed Cases</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>High-Severity Cases:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{card.highSeverity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Under Treatment:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{card.activeCases}</span>
                </div>
                <div className="flex justify-between">
                  <span>Affected Wards:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {card.wards.size > 0 ? Array.from(card.wards).slice(0, 4).join(', ') : 'City-wide'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
              <i className="fa-solid fa-shield-virus text-cyan-600 dark:text-cyan-400"></i>
              <span>SMC Public Health Stream</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiseaseSurveillance;
