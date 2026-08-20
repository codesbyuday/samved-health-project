"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SearchProvider } from './context/searchcontext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Prescriptions from './pages/Prescriptions';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import RareMedicines from './pages/RareMedicines';
import DemandSignals from './pages/DemandSignals';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import './styles.css';

const ProtectedLayout = ({ children }) => {
  const { user, authReady } = useAuth();
  if (!authReady) {
    return <div className="min-h-screen flex items-center justify-center text-soft">Restoring your dashboard session...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <SearchProvider>
            <Router basename="/pharma">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                <Route path="/inventory" element={<ProtectedLayout><Inventory /></ProtectedLayout>} />
                <Route path="/prescriptions" element={<ProtectedLayout><Prescriptions /></ProtectedLayout>} />
                <Route path="/orders" element={<ProtectedLayout><Orders /></ProtectedLayout>} />
                <Route path="/sales" element={<ProtectedLayout><Sales /></ProtectedLayout>} />
                <Route path="/rare-medicines" element={<ProtectedLayout><RareMedicines /></ProtectedLayout>} />
                <Route path="/demand" element={<ProtectedLayout><DemandSignals /></ProtectedLayout>} />
                <Route path="/alerts" element={<ProtectedLayout><Alerts /></ProtectedLayout>} />
                <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </SearchProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
