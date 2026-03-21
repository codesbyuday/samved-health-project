'use client';

import React, { useState, useCallback, useSyncExternalStore } from 'react';
import Sidebar, { PageType } from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoginPage from '@/components/common/LoginPage';
import DashboardPage from '@/components/dashboard/DashboardPage';
import AppointmentTable from '@/components/appointments/AppointmentTable';
import CitizenServices from '@/components/citizens/CitizenServices';
import PatientRecords from '@/components/patients/PatientRecords';
import LabReports from '@/components/lab/LabReports';
import BedManagement from '@/components/beds/BedManagement';
import InfrastructureStatus from '@/components/infrastructure/InfrastructureStatus';
import DiseaseAnalytics from '@/components/disease/DiseaseAnalytics';
import ReferralManagement from '@/components/referrals/ReferralManagement';
import MedicineStock from '@/components/medicine/MedicineStock';
import ComplaintResolution from '@/components/complaints/ComplaintResolution';
import StaffManagement from '@/components/staff/StaffManagement';
import SettingsPage from '@/components/common/SettingsPage';
import { cn } from '@/lib/utils';

// Custom hook for responsive sidebar without hydration issues
function useMediaQuery(query: string) {
  const subscribe = useCallback((callback: () => void) => {
    const matchMedia = window.matchMedia(query);
    matchMedia.addEventListener('change', callback);
    return () => matchMedia.removeEventListener('change', callback);
  }, [query]);

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => {
    return false; // Default to desktop view for SSR
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Update sidebar collapsed state when screen size changes
  React.useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleNavigate = useCallback((page: PageType) => {
    setCurrentPage(page);
    setIsMobileSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // Render the current page content
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'appointments':
        return <AppointmentTable />;
      case 'citizen-services':
        return <CitizenServices />;
      case 'patients':
        return <PatientRecords />;
      case 'lab-reports':
        return <LabReports />;
      case 'bed-management':
        return <BedManagement />;
      case 'infrastructure':
        return <InfrastructureStatus />;
      case 'disease-reporting':
        return <DiseaseAnalytics />;
      case 'referrals':
        return <ReferralManagement />;
      case 'medicine-stock':
        return <MedicineStock />;
      case 'complaints':
        return <ComplaintResolution />;
      case 'staff-management':
        return <StaffManagement />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Navbar */}
      <Navbar
        onMenuToggle={toggleSidebar}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 pb-10 min-h-screen transition-all duration-300 ease-in-out',
          // Mobile: full width
          'ml-0',
          // Desktop: based on sidebar state
          !isMobile && !isSidebarCollapsed && 'lg:ml-64',
          !isMobile && isSidebarCollapsed && 'lg:ml-16'
        )}
      >
        <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
          {renderPageContent()}
        </div>
      </main>

      {/* Footer */}
      <Footer isSidebarCollapsed={isSidebarCollapsed} />
    </div>
  );
}
