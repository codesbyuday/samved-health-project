import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../SearchContext';
import { useTheme } from '../context/ThemeContext';
import GlobalSearch from './GlobaSearch';

const Navbar = ({ provider, onLogout }) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [dropdown, setDropdown] = useState(false);
  const { query, performSearch, clearSearch } = useSearch();
  const [localQuery, setLocalQuery] = useState(query);
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== query) {
        performSearch(localQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, performSearch, query]);

  const handleClear = () => {
    setLocalQuery('');
    clearSearch();
  };

  return (
    <header className="topbar">
      <div className="flex items-center gap-4 relative" ref={searchRef}>
        <button onClick={() => navigate(-1)} className="icon-button">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="search-shell hidden md:flex">
          <i className="fa-solid fa-search text-[var(--muted)] mr-3"></i>
          <input
            type="text"
            placeholder="Search patients, reports, tests, IDs..."
            className="search-input"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
          {localQuery && (
            <button onClick={handleClear} className="text-[var(--muted)] hover:text-[var(--foreground)]">
              <i className="fa-solid fa-times-circle"></i>
            </button>
          )}
        </div>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="toggle-button" aria-label="Toggle theme">
          <span className="toggle-icon toggle-icon-left" aria-hidden="true">
            <i className="fa-solid fa-sun"></i>
          </span>
          <span className="toggle-icon toggle-icon-right" aria-hidden="true">
            <i className="fa-solid fa-moon"></i>
          </span>
          <span className={`toggle-thumb ${isDark ? 'translate-x-7' : 'translate-x-0'}`}>
            <i className={`fa-solid ${isDark ? 'fa-moon' : 'fa-sun'}`}></i>
          </span>
        </button>

        <button onClick={() => navigate('/reports')} className="btn-primary hidden md:flex">
          <i className="fa-solid fa-plus"></i>
          <span>New Report</span>
        </button>

        <button onClick={() => navigate('/notifications')} className="icon-button relative">
          <i className="fa-solid fa-bell"></i>
          <span className="notification-dot"></span>
        </button>

        <div className="relative">
          <button onClick={() => setDropdown(!dropdown)} className="profile-trigger">
            <div className="profile-avatar">{provider.name.charAt(0)}</div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-[var(--foreground)]">{provider.name}</p>
              <p className="text-xs text-[var(--muted)]">{provider.license || 'Provider profile'}</p>
            </div>
            <i className="fa-solid fa-chevron-down text-[var(--muted)] text-xs hidden lg:block"></i>
          </button>

          {dropdown && (
            <div className="dropdown-panel">
              <div className="px-4 py-3 border-b border-[var(--border-muted)]">
                <p className="text-xs text-[var(--muted)] font-medium">Connected provider</p>
                <p className="text-sm font-bold text-[var(--foreground)]">{provider.name}</p>
                <p className="text-xs text-[var(--accent)] mt-1">Ward {provider.ward_id || 'N/A'}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setDropdown(false);
                  }}
                  className="dropdown-item"
                >
                  <i className="fa-solid fa-gear w-5"></i>
                  <span>Settings</span>
                </button>
                <button onClick={onLogout} className="dropdown-item dropdown-item-danger">
                  <i className="fa-solid fa-power-off w-5"></i>
                  <span>Logout</span>
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
