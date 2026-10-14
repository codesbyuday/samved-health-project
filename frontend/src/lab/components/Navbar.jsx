import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../SearchContext';
import { useTheme } from '../context/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import GlobalSearch from './GlobaSearch';

const Navbar = ({ provider, onLogout, onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { providerNotifications } = useAppData();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { query, performSearch, clearSearch } = useSearch();
  const [localQuery, setLocalQuery] = useState(query);
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== query) {
        performSearch(localQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, performSearch, query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setLocalQuery('');
    clearSearch();
  };

  const displayName = provider?.name || 'Diagnostic Laboratory';
  const displayLicense = provider?.license || 'MH-LAB-ACTIVE';
  const initial = displayName.charAt(0) || 'L';

  return (
    <header className="relative z-30 mx-4 mt-4 flex h-20 items-center justify-between rounded-3xl px-4 md:mx-6 md:px-6 shadow-xs border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      {/* Mobile Hamburger Toggle (hidden on >= 600px / sm) */}
      <button
        type="button"
        onClick={onToggleMobileMenu}
        className="lab-hamburger-toggle sm:hidden flex items-center justify-center p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 mr-2 focus:outline-none cursor-pointer"
        aria-label="Toggle navigation menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search Input */}
      <div className="flex items-center gap-3 relative flex-1 max-w-lg" ref={searchRef}>
        <div className="relative w-full">
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
            placeholder="Search patients, reports, tests, IDs..."
            className="w-full pl-10 pr-9 py-2.5 text-xs md:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
          {localQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <GlobalSearch />
      </div>

      <div className="flex items-center space-x-3 md:space-x-4 ml-4">
        {/* Facility Info on Desktop/Tablet/Laptop */}
        {provider && (
          <div className="hidden lab-facility-info sm:block text-right">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[180px] md:max-w-[220px]">{displayName}</p>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
              Ward {provider.ward_id || 'N/A'} • <span className="font-mono text-slate-500 dark:text-slate-400">{displayLicense}</span>
            </p>
          </div>
        )}

        {/* Theme Toggle Button (matching Pharmacy) */}
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
              <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>

        {/* New Report Button */}
        <button
          onClick={() => navigate('/reports')}
          className="hidden lab-new-report-btn sm:flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          <span>New Report</span>
        </button>

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
            {providerNotifications?.length > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 z-50 mt-3 w-80 md:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    SMC Laboratory Advisories
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                    {providerNotifications?.length || 0}
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {!providerNotifications || providerNotifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No active circulars or notices.</p>
                  </div>
                ) : (
                  providerNotifications.map((notif, idx) => (
                    <div key={notif.notification_id || idx} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{notif.title || notif.message}</p>
                      {notif.title && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{notif.message}</p>
                      )}
                      <p className="mt-1 text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                        Ward {provider?.ward_id || 'City'} Circular
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Dropdown (matching Pharmacy) */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none cursor-pointer group"
            aria-expanded={showProfile}
            aria-label="Laboratory Profile Menu"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white font-extrabold text-sm shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform ring-2 ring-white dark:ring-slate-700">
              {initial}
            </div>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 hidden sm:block ${
                showProfile ? 'rotate-180 text-cyan-600 dark:text-cyan-400' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfile && (
            <div className="absolute right-0 z-50 mt-3 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-fade-in">
              {/* Header Profile Identity */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-cyan-50/40 dark:from-slate-850 dark:to-cyan-950/20">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white font-black text-lg shadow-md ring-2 ring-white dark:ring-slate-700">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {displayName}
                      </p>
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Lab" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                      {provider?.email || provider?.provider_id || 'lab@smc.gov.in'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                        {displayLicense}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Ward {provider?.ward_id || 'N/A'}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/50 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    <i className="fa-solid fa-sliders text-sm"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Laboratory Facility Settings</p>
                    <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">Address, licenses, ward details</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    navigate('/catalog');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/50 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    <i className="fa-solid fa-vials text-sm"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Test Catalog & Pricing</p>
                    <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">Configure investigations & fees</p>
                  </div>
                </button>
              </div>

              {/* Sign Out Action */}
              <div className="p-2 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100/60 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-200/80 transition-colors">
                    <i className="fa-solid fa-power-off text-sm"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-rose-600 dark:text-rose-400">Sign Out of Laboratory</p>
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

export default Navbar;
