import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { formatRelativeTime } from '../lib/format';

const Notifications = () => {
  const { providerNotifications } = useAppData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Municipal Communications
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Health Department Advisories & Alerts
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Official circulars, seasonal pathogen advisories, and ward-specific alerts issued by the Solapur Municipal Health Directorate.
          </p>
        </div>
      </div>

      <div className="surface-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        {!providerNotifications || providerNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <i className="fa-solid fa-bell-slash text-3xl mb-2 text-cyan-500"></i>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No active circulars or notices</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              There are currently no urgent health circulars for your laboratory or ward.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {providerNotifications.map((notification) => (
              <div
                key={notification.notification_id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-colors"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                  <i className="fa-solid fa-bullhorn text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {notification.title || 'Municipal Health Notification'}
                    </p>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                    {notification.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
