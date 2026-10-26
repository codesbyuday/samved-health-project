import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdown popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    if (location.pathname !== '/inventory') {
      navigate('/inventory');
    }
  };

  return (
    <header className="relative z-30 mx-4 mt-4 flex h-20 items-center justify-between rounded-3xl px-4 md:mx-6 md:px-6 shadow-sm border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      <div className="flex items-center">
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
            placeholder="Search medicines, batches, categories..."
            className="w-72 md:w-96 lg:w-[420px] pl-10 pr-9 py-2.5 text-xs md:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Theme Toggle Button (Light/Dark mode) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>

        {pharmacyProfile && (
          <div className="hidden text-right lg:block">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{pharmacyProfile.name}</p>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
              {pharmacyProfile.ward || 'Ward 5'} • <span className="font-mono text-slate-500 dark:text-slate-400">{pharmacyProfile.license}</span>
            </p>
          </div>
        )}

        {/* Notifications Button */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all focus:outline-none cursor-pointer"
            aria-label="View notifications"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 z-50 mt-3 w-80 md:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    SMC Health Notices
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                    {notifications.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No active health alerts or notices.</p>
                  </div>
                ) : (
                  notifications.map((alert, idx) => (
                    <div
                      key={alert.id || idx}
                      className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">{alert.message}</p>
                      <p className="mt-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                        {alert.type || 'Notice'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none cursor-pointer group"
            aria-expanded={showProfile}
            aria-label="Pharmacy Profile Menu"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-extrabold text-sm shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform ring-2 ring-white dark:ring-slate-700">
              {pharmacyProfile?.name?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 hidden sm:block ${
                showProfile ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfile && (
            <div className="absolute right-0 z-50 mt-3 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
              {/* Header Profile Identity */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-850 dark:to-teal-950/20">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-lg shadow-md shadow-teal-500/25 ring-2 ring-white dark:ring-slate-700">
                    {pharmacyProfile?.name?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {pharmacyProfile?.name || 'Pharmacy Dashboard'}
                      </p>
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Verified Pharmacy" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                      {pharmacyProfile?.email || pharmacyProfile?.provider_id || 'pharmacy@smc.gov.in'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                        {pharmacyProfile?.license || 'LIC-VERIFIED'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {pharmacyProfile?.ward || 'Ward 5'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Quick Links */}
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/50 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Facility Profile Settings</p>
                    <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">Address, licenses, contact details</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    navigate('/inventory');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/50 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Medicine Stock & Inventory</p>
                    <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">Manage medicine batches & pricing</p>
                  </div>
                </button>
              </div>

              {/* Sign Out Action */}
              <div className="p-2 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100/60 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-200/80 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-rose-600 dark:text-rose-400">Sign Out of Pharmacy</p>
                    <p className="text-[11px] font-normal text-rose-500/80 dark:text-rose-400/70">End current session securely</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
