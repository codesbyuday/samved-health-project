import React from 'react';
import { useData } from '../context/DataContext';

const severityStyles = {
  High: { border: '#d95757', background: 'var(--danger-soft)', text: '#d95757' },
  Medium: { border: '#d6940c', background: 'var(--warning-soft)', text: '#b7791f' },
  Low: { border: '#4587f5', background: 'rgba(69, 135, 245, 0.14)', text: '#3068c9' },
};

const AlertsPage = () => {
  const { alerts, loading } = useData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Public Health Alerts</h1>
        <p className="page-subtitle">Regional and facility alerts from the shared connected dataset.</p>
      </div>

      <div className="space-y-4">
        {loading && <div className="surface-card rounded-3xl p-6 text-soft">Loading alerts...</div>}

        {!loading && alerts.length === 0 && <div className="surface-card rounded-3xl p-6 text-soft">No active alerts were returned.</div>}

        {alerts.map((alert) => {
          const style = severityStyles[alert.severity] || severityStyles.Low;

          return (
            <div key={alert.alert_id} className="surface-card rounded-[1.5rem] p-5" style={{ borderLeft: `4px solid ${style.border}` }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">
                    {alert.type} | {alert.ward}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-main">{alert.message}</h3>
                </div>
                <span className="status-pill" style={{ background: style.background, color: style.text }}>
                  {alert.severity}
                </span>
              </div>
              <p className="mt-3 text-sm text-soft">Date: {alert.date}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPage;
