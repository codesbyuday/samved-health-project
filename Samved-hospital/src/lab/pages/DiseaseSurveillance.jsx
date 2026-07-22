import React, { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';

const DiseaseSurveillance = () => {
  const { diseaseCases } = useAppData();

  const cards = useMemo(() => {
    const grouped = diseaseCases.reduce((accumulator, item) => {
      const key = item.diseases?.disease_name || 'Unknown disease';
      if (!accumulator[key]) {
        accumulator[key] = {
          disease: key,
          cases: 0,
          highSeverity: 0,
          ward: item.citizens?.ward_number || 'N/A',
        };
      }

      accumulator[key].cases += 1;
      if (item.severity?.toLowerCase() === 'high') {
        accumulator[key].highSeverity += 1;
      }

      return accumulator;
    }, {});

    return Object.values(grouped).map((item) => ({
      ...item,
      risk: item.highSeverity > 2 ? 'High' : item.highSeverity > 0 ? 'Medium' : 'Low',
    }));
  }, [diseaseCases]);

  return (
    <div className="page-stack">
      <div>
        <p className="eyebrow">Epidemiology</p>
        <h1 className="section-title">Disease surveillance</h1>
        <p className="section-copy">Aggregated from `disease_cases`, `diseases`, and `citizens` to reflect the health ecosystem schema you provided.</p>
      </div>

      <div className="card-grid">
        {cards.map((card) => (
          <article key={card.disease} className="panel catalog-card">
            <div className="section-header">
              <h2 className="subsection-title">{card.disease}</h2>
              <span className="status-pill">{card.risk}</span>
            </div>
            <p className="row-copy">Ward {card.ward}</p>
            <div className="surveillance-metric">{card.cases}</div>
            <p className="row-copy">Total cases logged in the latest synced dataset.</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default DiseaseSurveillance;
