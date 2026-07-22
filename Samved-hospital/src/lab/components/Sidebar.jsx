import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menu = [
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

  return (
    <aside className="sidebar-shell">
      <div className="sidebar-brand">
        <div className="flex items-center gap-3">
          <div className="brand-mark">
            <i className="fa-solid fa-dna text-white"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">SAMVED Lab</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted-strong)]">Health Ecosystem</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-idle'}`}
          >
            <i className={`fa-solid ${item.icon} w-5`}></i>
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
