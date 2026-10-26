"use client";

import React, { useCallback, useSyncExternalStore, useState, useEffect } from "react";
import { Hospital, CheckCircle2, Clock, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import HospitalDocuments from "@/components/hospital/HospitalDocuments";
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

  const [hospitalStatus, setHospitalStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const { hospitalId } = useRBAC();

  useEffect(() => {
    if (hospitalId) {
      const fetchStatus = async () => {
        try {
          const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
          const baseUrl = apiBase.endsWith("/api/v1") ? apiBase : `${apiBase}/api/v1`;
          const res = await fetch(`${baseUrl}/hospitals/${hospitalId}`);
          if (res.ok) {
            const data = await res.json();
            setHospitalStatus(data.status || (data.verified_by_smc ? 'approved' : 'pending'));
          } else {
             setHospitalStatus('approved');
          }
        } catch (error) {
          console.error("Failed to fetch hospital status", error);
          setHospitalStatus('approved');
        } finally {
          setStatusLoading(false);
        }
      };
      fetchStatus();
    } else {
      setStatusLoading(false);
      setHospitalStatus('approved');
    }
  }, [hospitalId]);


  React.useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);

  React.useEffect(() => {
    if (!visibleModules.includes(currentPage)) {
      setCurrentPage((visibleModules[0] as PageType) || "settings");
    }
  }, [currentPage, visibleModules]);

  const [selectedPatientForRecords, setSelectedPatientForRecords] = useState<any>(null);

  const handleNavigate = useCallback((page: PageType, payload?: any) => {
    if (page === 'patients' && payload) {
      setSelectedPatientForRecords(payload);
    }
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
        return <PatientRecords initialCitizen={selectedPatientForRecords} />;
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
      case "documents":
        return <HospitalDocuments />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  if (statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  if (hospitalStatus === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-amber-100">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Pending</h2>
          <p className="text-slate-600 mb-6">
            Your hospital registration is currently under review by the Solapur Municipal Corporation (SMC) officials.
          </p>
          <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-800 text-left mb-6 border border-amber-200">
            <p className="font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Application in Queue</p>
            <p className="mt-1 opacity-90">Officers are verifying your provided information and documents. This process typically takes 1-2 business days.</p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full bg-slate-900 hover:bg-slate-800">
            Refresh Status
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navbar
        onMenuToggle={toggleSidebar}
        isMobileSidebarOpen={isMobileSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
        onNavigate={handleNavigate}
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

