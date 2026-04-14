"use client";

import React, { useCallback, useSyncExternalStore, useState } from "react";
import Sidebar, { PageType } from "@/components/layout/Sidebar";
import AccessDenied from "@/components/auth/AccessDenied";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardPage from "@/components/dashboard/DashboardPage";
import AppointmentTable from "@/components/appointments/AppointmentTable";
import CitizenServices from "@/components/citizens/CitizenServices";
import PatientRecords from "@/components/patients/PatientRecords";
import LabReports from "@/components/lab/LabReports";
import BedManagement from "@/components/beds/BedManagement";
import InfrastructureStatus from "@/components/infrastructure/InfrastructureStatus";
import DiseaseAnalytics from "@/components/disease/DiseaseAnalytics";
import ReferralManagement from "@/components/referrals/ReferralManagement";
import MedicineStock from "@/components/medicine/MedicineStock";
import ComplaintResolution from "@/components/complaints/ComplaintResolution";
import StaffManagement from "@/components/staff/StaffManagement";
import SettingsPage from "@/components/common/SettingsPage";
import { useRBAC } from "@/hooks/use-rbac";
import { cn } from "@/lib/utils";

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const matchMedia = window.matchMedia(query);
      matchMedia.addEventListener("change", callback);
      return () => matchMedia.removeEventListener("change", callback);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function DashboardShell() {
  const { canAccessModule, visibleModules } = useRBAC();
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isMobile = useMediaQuery("(max-width: 1023px)");

  React.useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);

  React.useEffect(() => {
    if (!visibleModules.includes(currentPage)) {
      setCurrentPage((visibleModules[0] as PageType) || "settings");
    }
  }, [currentPage, visibleModules]);

  const handleNavigate = useCallback((page: PageType) => {
    setCurrentPage(page);
    setIsMobileSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }

    setIsSidebarCollapsed((prev) => !prev);
  }, [isMobile]);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const renderPageContent = () => {
    if (!canAccessModule(currentPage)) {
      return <AccessDenied message="You do not have permission to open this module." />;
    }

    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={handleNavigate} />;
      case "appointments":
        return <AppointmentTable />;
      case "citizen-services":
        return <CitizenServices />;
      case "patients":
        return <PatientRecords />;
      case "lab-reports":
        return <LabReports />;
      case "bed-management":
        return <BedManagement />;
      case "infrastructure":
        return <InfrastructureStatus />;
      case "disease-reporting":
        return <DiseaseAnalytics />;
      case "referrals":
        return <ReferralManagement />;
      case "medicine-stock":
        return <MedicineStock />;
      case "complaints":
        return <ComplaintResolution />;
      case "staff-management":
        return <StaffManagement />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navbar
        onMenuToggle={toggleSidebar}
        isMobileSidebarOpen={isMobileSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
      />

      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      <main
        className={cn(
          "min-h-screen pb-10 pt-16 transition-all duration-300 ease-in-out",
          "ml-0",
          !isMobile && !isSidebarCollapsed && "lg:ml-64",
          !isMobile && isSidebarCollapsed && "lg:ml-16"
        )}
      >
        <div className="min-h-screen bg-transparent p-4 transition-colors duration-300 md:p-6">
          {renderPageContent()}
        </div>
      </main>

      <Footer isSidebarCollapsed={isSidebarCollapsed} />
    </div>
  );
}
