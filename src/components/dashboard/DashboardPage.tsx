'use client';

import React, { useState, useEffect } from 'react';
import SummaryCard from './SummaryCard';
import { PatientVisitsChart, DiseaseTrendsChart, BedOccupancyChart } from './DashboardCharts';
import NotificationsPanel from './Notifications';
import RecentActivityFeed from './RecentActivityFeed';
import { dashboardService } from '@/services/database';
import { useRBAC } from '@/hooks/use-rbac';
import {
  CalendarDays,
  BedDouble,
  Activity,
  FlaskConical,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { PageType } from '@/components/layout/Sidebar';
import { format } from 'date-fns';

interface DashboardPageProps {
  onNavigate: (page: PageType) => void;
}

interface DashboardStats {
  totalAppointmentsToday: number;
  appointmentsTrend: { value: number; isPositive: boolean };
  bedsAvailable: number;
  icuBedsAvailable: number;
  emergencyBedsAvailable: number;
  totalPatients: number;
  patientsTrend: { value: number; isPositive: boolean };
  totalBeds: number;
  occupiedBeds: number;
  bedOccupancyTrend: { value: number; isPositive: boolean };
  pendingLabReports: number;
  labTrend: { value: number; isPositive: boolean };
  pendingComplaints: number;
  complaintsTrend: { value: number; isPositive: boolean };
  totalStaff: number;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { canAccessModule } = useRBAC();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const loadDashboardStats = async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: statsError } = await dashboardService.getStatsWithTrends();
    
    if (statsError) {
      setError(statsError);
    } else if (data) {
      setStats(data);
      setLastUpdated(new Date());
    }
    
    setIsLoading(false);
  };

  const handleNavigate = (page: PageType) => {
    if (canAccessModule(page)) {
      onNavigate(page);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboardStats();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-2 text-slate-600 dark:text-slate-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="mt-2 text-red-600">{error}</p>
          <button 
            onClick={loadDashboardStats}
            className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-white transition-colors hover:bg-emerald-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-gradient-to-r from-white via-emerald-50 to-amber-50 p-5 shadow-sm dark:border-emerald-900/60 dark:from-stone-950 dark:via-emerald-950/30 dark:to-amber-950/20">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-300/30 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200">
            Command Center
          </p>
          <h2 className="text-3xl font-bold text-stone-900 dark:text-white">Hospital Operations Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time hospital overview and control panel
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Last updated: {format(lastUpdated, 'HH:mm:ss')}</span>
          </div>
          <button
            onClick={loadDashboardStats}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white/80 px-3 py-1.5 text-sm transition-colors hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-stone-950/60 dark:hover:bg-emerald-950/40"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <SummaryCard
          title="Visits Today"
          value={stats?.totalAppointmentsToday || 0}
          icon={<CalendarDays className="h-6 w-6" />}
          variant="primary"
          trend={stats?.appointmentsTrend}
          onClick={canAccessModule('patients') ? () => handleNavigate('patients') : undefined}
        />
        <SummaryCard
          title="Beds Available"
          value={stats?.bedsAvailable || 0}
          icon={<BedDouble className="h-6 w-6" />}
          variant="success"
          description={`of ${stats?.totalBeds || 0} total beds`}
          onClick={canAccessModule('bed-management') ? () => handleNavigate('bed-management') : undefined}
        />
        <SummaryCard
          title="ICU Beds"
          value={stats?.icuBedsAvailable || 0}
          icon={<Activity className="h-6 w-6" />}
          variant="warning"
          description="Available now"
          onClick={canAccessModule('bed-management') ? () => handleNavigate('bed-management') : undefined}
        />
        <SummaryCard
          title="Pending Lab Reports"
          value={stats?.pendingLabReports || 0}
          icon={<FlaskConical className="h-6 w-6" />}
          variant="default"
          trend={stats?.labTrend}
          onClick={canAccessModule('lab-reports') ? () => handleNavigate('lab-reports') : undefined}
        />
        <SummaryCard
          title="Pending Complaints"
          value={stats?.pendingComplaints || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="danger"
          trend={stats?.complaintsTrend}
          onClick={canAccessModule('complaints') ? () => handleNavigate('complaints') : undefined}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/40 dark:to-stone-950 dark:border-emerald-900/60 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Citizens</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{(stats?.totalPatients || 0).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1">
              {stats?.patientsTrend?.isPositive ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-xs font-medium ${stats?.patientsTrend?.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                +{stats?.patientsTrend?.value || 0}%
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-gradient-to-r from-red-50 to-white dark:from-red-950/50 dark:to-slate-900 dark:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Occupied Beds</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats?.occupiedBeds || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Occupancy</p>
              <p className="text-lg font-semibold text-red-600">
                {stats?.totalBeds ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/50 dark:to-slate-900 dark:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Emergency Beds</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats?.emergencyBedsAvailable || 0}</p>
            </div>
            <Activity className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Available for emergency cases</p>
        </div>
        <div className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-white dark:from-green-950/50 dark:to-slate-900 dark:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Staff</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats?.totalStaff || 0}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PatientVisitsChart />
        <DiseaseTrendsChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BedOccupancyChart />
        <NotificationsPanel className="lg:col-span-2" />
      </div>

      {/* Recent Activity Feed */}
      <RecentActivityFeed />
    </div>
  );
}
