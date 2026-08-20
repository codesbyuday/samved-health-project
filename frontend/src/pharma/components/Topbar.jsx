import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/searchcontext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const Topbar = () => {
  const { pharmacyProfile, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const { notifications } = useData();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    if (window.location.pathname !== '/inventory') {
      navigate('/inventory');
    }
  };

  return (
    <header className="surface-panel relative z-10 mx-4 mt-4 flex h-20 items-center justify-between rounded-3xl px-4 md:mx-6 md:px-6">
      <div className="flex items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search medicines in inventory..."
            className="input-shell w-64 pl-10 pr-4 text-sm md:w-80"
            value={searchTerm}
            onChange={handleSearch}
          />
          <svg className="absolute left-3 top-3 h-5 w-5 text-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="hidden items-center gap-3 md:flex">
          <span className="text-sm text-soft">{theme === 'dark' ? 'Night mode' : 'Day mode'}</span>
          <button type="button" className="theme-switch" onClick={toggleTheme} aria-label="Toggle color theme">
            <span />
          </button>
        </div>

        {pharmacyProfile && (
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-main">{pharmacyProfile.name}</p>
            <p className="text-xs text-soft">{pharmacyProfile.ward}</p>
          </div>
        )}

        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="surface-muted relative rounded-2xl p-3 focus:outline-none">
            <svg className="h-5 w-5 text-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.some((item) => !item.read) && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500"></span>
            )}
          </button>

          {showNotifications && (
            <div className="surface-card absolute right-0 z-20 mt-3 w-80 rounded-3xl py-2">
              <h3 className="px-4 py-2 text-sm font-semibold text-main">Notifications</h3>
              {notifications.length === 0 && <div className="empty-state">No notifications yet.</div>}
              {notifications.map((alert) => (
                <div key={alert.id} className="border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm text-main">{alert.message}</p>
                  <p className="mt-1 text-xs text-faint">{alert.type}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setShowProfile(!showProfile)} className="flex items-center space-x-2 focus:outline-none">
            <div className="brand-mark flex h-10 w-10 items-center justify-center rounded-2xl font-bold shadow-md">
              {pharmacyProfile?.name?.charAt(0) || 'P'}
            </div>
          </button>

          {showProfile && (
            <div className="surface-card absolute right-0 z-20 mt-3 w-56 rounded-3xl py-2">
              <button onClick={logout} className="w-full px-4 py-2 text-left text-sm text-main">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
