'use client';

import React from 'react';
import { cn } from '@/lib/utils';
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
  const handleNavigate = (page: PageType) => {
    onNavigate(page);
  };

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
          'fixed top-0 left-0 z-50 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white',
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
          className="lg:hidden absolute top-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Desktop Toggle Button - Outside Sidebar */}
        <button
          onClick={onClose}
          className={cn(
            'hidden lg:flex absolute -right-3 top-20 z-50 h-6 w-6 items-center justify-center rounded-full bg-[#1E88E5] text-white shadow-lg hover:bg-[#1565C0] transition-all duration-300',
            !isCollapsed && 'rotate-180'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Hospital Branding */}
        <div className="p-4 border-b border-slate-700 pt-16 lg:pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E88E5]/20 flex-shrink-0">
              <Activity className="h-6 w-6 text-[#1E88E5]" />
            </div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                isCollapsed && 'lg:w-0 lg:opacity-0'
              )}
            >
              <p className="text-sm font-semibold whitespace-nowrap">SMC Hospital</p>
              <p className="text-xs text-slate-400 whitespace-nowrap">Solapur Municipal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2 overflow-y-auto h-[calc(100vh-14rem)]">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    currentPage === item.id
                      ? 'bg-[#1E88E5] text-white shadow-lg shadow-[#1E88E5]/25'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
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
                        'flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold transition-all duration-200',
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
          <div className="rounded-lg bg-gradient-to-r from-red-600/20 to-orange-600/20 p-3 border border-red-500/30">
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
