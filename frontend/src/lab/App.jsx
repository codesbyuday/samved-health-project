"use client";

import React, { useMemo, useState } from 'react';
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
  const [isAuth, setIsAuth] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('samved-session') === 'signed-in';
    }
    return false;
  });
  const { currentProvider, loading } = useAppData();
  const shellClassName = useMemo(() => 'app-shell', []);

  if (!isAuth) {
    return <Login onLogin={() => {
      localStorage.setItem('samved-session', 'signed-in');
      setIsAuth(true);
    }} />;
  }

  return (
    <div className={shellClassName}>
      <Sidebar />
      <div className="content-shell">
        <Navbar
          provider={currentProvider}
          onLogout={() => {
            localStorage.setItem('samved-session', 'signed-out');
            setIsAuth(false);
          }}
        />
        <main className="content-main">
          <div className="content-inner">
            {loading ? (
              <div className="panel hero-panel">
                <p className="eyebrow">Syncing Workspace</p>
                <h1 className="section-title">Connecting to SAMVED health data</h1>
                <p className="section-copy">Loading provider profile, appointments, reports, catalog, alerts, and surveillance metrics.</p>
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
