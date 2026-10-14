import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

const menuItems = [
  { path: '/', icon: 'fa-chart-line', label: 'Dashboard' },
  { path: '/bookings', icon: 'fa-calendar-check', label: 'Test Bookings' },
  { path: '/collection', icon: 'fa-flask-vial', label: 'Sample Flow' },
  { path: '/reports', icon: 'fa-file-medical', label: 'Reports' },
  { path: '/catalog', icon: 'fa-vials', label: 'Test Catalog' },
  { path: '/history', icon: 'fa-clock-rotate-left', label: 'History' },
  { path: '/surveillance', icon: 'fa-shield-virus', label: 'Surveillance' },
  { path: '/notifications', icon: 'fa-bell', label: 'Alerts' },
  { path: '/settings', icon: 'fa-sliders', label: 'Settings' },
];

const SidebarContent = ({ currentProvider, onLinkClick }) => (
  <div className="flex flex-col h-full">
    {/* Brand Header Card */}
    <div className="surface-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 dark:from-cyan-500 dark:to-teal-600 text-white font-bold text-xl shadow-lg shadow-cyan-600/25">
        <i className="fa-solid fa-flask-vial text-xl sm:text-2xl text-white"></i>
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-main">Lab Dashboard</h1>
      <p className="mt-1 text-xs sm:text-sm text-soft">Pathology, phlebotomy & diagnostic investigations.</p>
    </div>

    {/* Navigation Menu */}
    <nav className="mt-4 sm:mt-5 flex-1 space-y-1 overflow-y-auto pr-1">
      {menuItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.path}
          end={item.path === '/'}
          onClick={onLinkClick}
          className={({ isActive }) =>
            `flex items-center space-x-3 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 ${
              isActive
                ? 'surface-card font-bold text-main shadow-xs border-l-4 border-l-cyan-600 dark:border-l-cyan-400'
                : 'text-soft hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-main font-medium'
            }`
          }
        >
          <i className={`fa-solid ${item.icon} w-5 text-center text-sm`}></i>
          <span className="text-sm">{item.label}</span>
        </NavLink>
      ))}
    </nav>

    {/* Facility Profile Card */}
    <div className="surface-card rounded-3xl p-3.5 sm:p-4 text-xs mt-3">
      <p className="font-bold text-main truncate">{currentProvider?.name || 'Diagnostic Laboratory'}</p>
      <p className="mt-1 text-soft font-medium truncate">
        Ward {currentProvider?.ward_id || 'N/A'} •{' '}
        <span className="font-mono text-faint font-semibold">
          {currentProvider?.license || 'MH-LAB-ACTIVE'}
        </span>
      </p>
      <p className="mt-1 text-[11px] font-mono text-cyan-700 dark:text-cyan-400 font-bold truncate">
        {currentProvider?.provider_id || ''}
      </p>
    </div>
  </div>
);

const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { currentProvider } = useAppData();

  return (
    <>
      {/* Permanent Desktop/Tablet/Laptop Sidebar (docked on >= 600px & sm breakpoint) */}
      <aside className="surface-panel lab-sidebar-persistent hidden sm:flex w-56 md:w-64 xl:w-72 shrink-0 flex-col border-r px-3 sm:px-4 py-5 transition-all">
        <SidebarContent currentProvider={currentProvider} />
      </aside>

      {/* Mobile Drawer (visible only on true mobile phones < sm / < 600px when triggered) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden lab-drawer-mobile">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-72 flex-col surface-panel px-4 py-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Navigation Menu</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <SidebarContent currentProvider={currentProvider} onLinkClick={onCloseMobile} />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
