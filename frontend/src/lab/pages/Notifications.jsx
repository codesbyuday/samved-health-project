import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { formatRelativeTime } from '../lib/format';

const Notifications = () => {
  const { providerNotifications } = useAppData();

  return (
    <div className="page-stack">
      <div>
        <p className="eyebrow">Alerts</p>
        <h1 className="section-title">Notifications</h1>
        <p className="section-copy">Recent messages filtered for the current provider role and ward where those targets are present in the database.</p>
      </div>

      <div className="panel">
        <div className="list-stack">
          {providerNotifications.map((notification) => (
            <div key={notification.notification_id} className="list-row">
              <div>
                <p className="row-title">{notification.title || 'System notification'}</p>
                <p className="row-copy">{notification.message}</p>
              </div>
              <span className="row-meta">{formatRelativeTime(notification.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
