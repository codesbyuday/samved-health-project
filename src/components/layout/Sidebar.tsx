'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useRBAC } from '@/hooks/use-rbac';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  BedDouble,
  Building2,
  AlertTriangle,
  Pill,
  MessageSquareWarning,
  Settings,
  ChevronLeft,
  Activity,
  Stethoscope,
  X,
  UserCog,
  UserPlus,
  ArrowRightLeft,
} from 'lucide-react';

export type PageType =
  | 'dashboard'
  | 'appointments'
  | 'citizen-services'
  | 'patients'
  | 'lab-reports'
  | 'bed-management'
  | 'infrastructure'
  | 'disease-reporting'
  | 'referrals'
  | 'medicine-stock'
  | 'complaints'
  | 'staff-management'
  | 'settings';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  isCollapsed: boolean;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: PageType;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: <CalendarDays className="h-5 w-5" />,
    badge: 5,
  },
  {
    id: 'citizen-services',
    label: 'Citizen Services',
    icon: <UserPlus className="h-5 w-5" />,
  },
  {
    id: 'patients',
    label: 'Patient Records',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'lab-reports',
    label: 'Lab Reports',
    icon: <FileText className="h-5 w-5" />,
    badge: 2,
  },
  {
    id: 'bed-management',
    label: 'Bed Management',
    icon: <BedDouble className="h-5 w-5" />,
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: 'disease-reporting',
    label: 'Disease Analytics',
    icon: <Activity className="h-5 w-5" />,
    badge: 3,
  },
  {
    id: 'referrals',
    label: 'Referrals',
    icon: <ArrowRightLeft className="h-5 w-5" />,
  },
  {
    id: 'medicine-stock',
    label: 'Medicine Stock',
    icon: <Pill className="h-5 w-5" />,
  },
  {
    id: 'staff-management',
    label: 'Staff Management',
    icon: <UserCog className="h-5 w-5" />,
  },
  {
    id: 'complaints',
    label: 'Complaints',
    icon: <MessageSquareWarning className="h-5 w-5" />,
    badge: 4,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

export default function Sidebar({
  currentPage,
  onNavigate,
  isCollapsed,
  isOpen,
  onClose,
}: SidebarProps) {
  const { visibleModules } = useRBAC();

  const handleNavigate = (page: PageType) => {
    onNavigate(page);
  };

  const visibleNavItems = navItems.filter((item) => visibleModules.includes(item.id));

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen border-r border-amber-200/10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_18rem),linear-gradient(180deg,#07120f,#10231d_48%,#1c1917)] text-white shadow-2xl shadow-stone-950/30',
          'transition-all duration-300 ease-in-out',
          // Mobile: slide in/out from left
          'transform lg:transform-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop: collapse/expand width
          isCollapsed ? 'lg:w-16' : 'lg:w-64',
          // Mobile always full width
          'w-64'
        )}
      >
        {/* Mobile Close Button - Inside Sidebar */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Desktop Toggle Button - Outside Sidebar */}
        <button
          onClick={onClose}
          className={cn(
            'hidden lg:flex absolute -right-3 top-20 z-50 h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-amber-400 text-white shadow-lg shadow-emerald-900/30 hover:scale-105 transition-all duration-300',
            !isCollapsed && 'rotate-180'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Hospital Branding */}
        <div className="p-4 border-b border-white/10 pt-16 lg:pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-600 to-amber-400 shadow-lg shadow-emerald-900/25 flex-shrink-0">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                isCollapsed && 'lg:w-0 lg:opacity-0'
              )}
            >
              <p className="text-sm font-semibold whitespace-nowrap">Hospital Portal</p>
              <p className="text-xs text-slate-300 whitespace-nowrap">by Tech-Lifter</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2 overflow-y-auto h-[calc(100vh-14rem)]">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-emerald-700 via-teal-600 to-amber-500 text-white shadow-lg shadow-emerald-900/25'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={cn(
                      'flex-1 text-left whitespace-nowrap transition-all duration-200',
                      isCollapsed && 'lg:w-0 lg:opacity-0 lg:overflow-hidden'
                    )}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold transition-all duration-200',
                        isCollapsed && 'lg:hidden'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Emergency Section */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-2xl bg-gradient-to-r from-rose-500/20 to-orange-400/20 p-3 border border-rose-400/30 shadow-lg shadow-rose-950/20">
            <div
              className={cn(
                'flex items-center gap-2 text-sm font-medium text-red-400',
                isCollapsed && 'lg:justify-center'
              )}
            >
              <Stethoscope className="h-4 w-4 flex-shrink-0" />
              <span
                className={cn(
                  'whitespace-nowrap transition-all duration-200',
                  isCollapsed && 'lg:hidden'
                )}
              >
                Emergency Hotline
              </span>
            </div>
            <p
              className={cn(
                'mt-1 text-xs text-slate-400 whitespace-nowrap transition-all duration-200',
                isCollapsed && 'lg:hidden'
              )}
            >
              Call: 108 / 112
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
