'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
  Menu,
  X,
  Hospital,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

interface NavbarProps {
  onMenuToggle: () => void;
  isMobileSidebarOpen: boolean;
}

// Static notification data to avoid hydration issues
const staticNotifications = [
  { id: '1', title: 'Disease Alert', message: 'Dengue cases reported in Ward 12', type: 'alert', timeAgo: '15 min ago', read: false },
  { id: '2', title: 'Stock Alert', message: 'Paracetamol stock is running low', type: 'warning', timeAgo: '45 min ago', read: false },
  { id: '3', title: 'Equipment Maintenance', message: 'MRI Machine scheduled for maintenance', type: 'info', timeAgo: '2 hours ago', read: true },
];

export default function Navbar({ onMenuToggle, isMobileSidebarOpen }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();

  const unreadCount = staticNotifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-slate-900/95 dark:border-slate-700">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Menu Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileSidebarOpen ? (
              <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            ) : (
              <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            )}
          </Button>

          {/* Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1E88E5] to-blue-600 shadow-md">
              <Hospital className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                SMC Hospital Portal
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Solapur Municipal Corporation
              </span>
            </div>
          </div>

          {/* Government Badge */}
          <Badge
            variant="outline"
            className="hidden md:flex items-center gap-1 bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400"
          >
            <Shield className="h-3 w-3" />
            <span className="text-xs font-medium">Govt. Hospital</span>
          </Badge>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 justify-center px-8 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search patients, appointments, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 bg-slate-50 border-slate-200 focus:bg-white h-9 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <Search className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </Button>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={mounted && theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {!mounted ? (
              <Moon className="h-5 w-5 text-slate-600" />
            ) : theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 dark:bg-slate-800 dark:border-slate-700">
              <DropdownMenuLabel className="flex items-center justify-between dark:text-white">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-slate-700" />
              <div className="max-h-80 overflow-y-auto">
                {staticNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      'flex flex-col items-start gap-1 p-3 cursor-pointer dark:focus:bg-slate-700',
                      !notification.read && 'bg-blue-50/50 dark:bg-blue-900/20'
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <span className="text-sm font-medium flex-1 dark:text-white">{notification.title}</span>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pl-7">
                      {notification.message}
                    </p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 pl-7">
                      {notification.timeAgo}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator className="dark:bg-slate-700" />
              <DropdownMenuItem className="text-center text-[#1E88E5] font-medium dark:text-blue-400">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1E88E5] to-blue-600 text-white font-medium text-sm">
                  D
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-700 dark:text-white">
                    Dr. Rajesh Patil
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Admin
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dark:bg-slate-800 dark:border-slate-700">
              <DropdownMenuLabel className="dark:text-white">
                <div className="flex flex-col">
                  <span className="font-medium">Dr. Rajesh Patil</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    admin.smchospital@solapur.gov.in
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-slate-700" />
              <DropdownMenuItem className="gap-2 dark:text-white dark:focus:bg-slate-700">
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 dark:text-white dark:focus:bg-slate-700">
                <Settings className="h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 dark:text-white dark:focus:bg-slate-700">
                <HelpCircle className="h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-slate-700" />
              <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 dark:focus:bg-slate-700">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="md:hidden border-t p-2 dark:border-slate-700 dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
