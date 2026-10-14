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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">SMC Public Health Advisories & Outbreak Alerts</h1>
          <p className="page-subtitle">
            Official municipal health advisories, vaccination drives, and hot outbreak notices broadcasted by SMC.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="surface-card rounded-3xl p-8 text-center text-soft">
            Fetching active public health notices...
          </div>
        )}

        {!loading && (alerts || []).length === 0 && (
          <div className="surface-card rounded-3xl p-8 text-center text-soft">
            No public health alerts are active for your area right now.
          </div>
        )}

        {(alerts || []).map((alert) => {
          const style = severityStyles[alert.severity] || severityStyles.Low;

          return (
            <div
              key={alert.alert_id}
              className="surface-card rounded-[1.75rem] p-6 border border-white/5 shadow-md transition-all hover:border-white/10"
              style={{ borderLeft: `5px solid ${style.border}` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#47c2bf]">
                      {alert.type}
                    </span>
                    <span className="text-xs text-soft">•</span>
                    <span className="text-xs font-semibold text-main">{alert.ward}</span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-main leading-relaxed">{alert.message}</h3>
                </div>
                <span
                  className="status-pill text-xs font-semibold uppercase shrink-0"
                  style={{ background: style.background, color: style.text }}
                >
                  {alert.severity} Priority
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-faint" style={{ borderColor: 'var(--border)' }}>
                <span>Issued by Solapur Municipal Health Department</span>
                <span className="font-mono text-soft">Date: {alert.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPage;
