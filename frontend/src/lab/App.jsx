"use client";

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SearchProvider } from './SearchContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TestBookings from './pages/TestBookings';
import SampleCollection from './pages/SampleCollection';
import ReportUpload from './pages/ReportUpload';
import TestCatalog from './pages/TestCatalog';
import TestHistory from './pages/TestHistory';
import DiseaseSurveillance from './pages/DiseaseSurveillance';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import './index.css';

const AppShell = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('lab-dashboard-session');
      return !!session && localStorage.getItem('samved-session') === 'signed-in';
    }
    return false;
  });
  const { currentProvider, loading, refreshData } = useAppData();

  if (!isAuth) {
    return (
      <Login
        onLogin={() => {
          setIsAuth(true);
          if (refreshData) refreshData();
        }}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('samved-session');
    localStorage.removeItem('lab-dashboard-session');
    localStorage.removeItem('samved-provider-id');
    setIsAuth(false);
  };

  return (
    <div className="app-shell flex h-screen bg-[#f3f7f8] dark:bg-[#071619] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar
          provider={currentProvider}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />
        <main className="app-scroll flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="surface-card rounded-3xl p-12 text-center space-y-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto"></div>
                <h2 className="text-lg font-bold text-main">Syncing Laboratory Workspace</h2>
                <p className="text-sm text-soft">Connecting to municipal database for live test bookings, investigations, and reports...</p>
              </div>
            ) : (
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bookings" element={<TestBookings />} />
                <Route path="/collection" element={<SampleCollection />} />
                <Route path="/reports" element={<ReportUpload />} />
                <Route path="/catalog" element={<TestCatalog />} />
                <Route path="/history" element={<TestHistory />} />
                <Route path="/surveillance" element={<DiseaseSurveillance />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <BrowserRouter basename="/lab">
          <SearchProvider>
            <AppShell />
          </SearchProvider>
        </BrowserRouter>
      </AppDataProvider>
    </ThemeProvider>
  );
};

export default App;
