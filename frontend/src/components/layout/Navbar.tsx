'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Search,
  LogOut,
  Settings,
  HelpCircle,
  User,
  ChevronDown,
  Menu,
  X,
  Hospital,
  Shield,
  Moon,
  Sun,
  Loader2,
  CalendarDays,
  Compass,
  ArrowRight,
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
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { type PageType } from '@/components/layout/Sidebar';
import { globalSearchService, type GlobalSearchResultItem } from '@/services/database';

interface NavbarProps {
  onMenuToggle: () => void;
  isMobileSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isMobile: boolean;
  onNavigate?: (page: PageType, payload?: any) => void;
}

// Static notification data to avoid hydration issues
const staticNotifications = [
  { id: '1', title: 'Disease Alert', message: 'Dengue cases reported in Ward 12', type: 'alert', timeAgo: '15 min ago', read: false },
  { id: '2', title: 'Stock Alert', message: 'Paracetamol stock is running low', type: 'warning', timeAgo: '45 min ago', read: false },
  { id: '3', title: 'Equipment Maintenance', message: 'MRI Machine scheduled for maintenance', type: 'info', timeAgo: '2 hours ago', read: true },
];

export default function Navbar({
  onMenuToggle,
  isMobileSidebarOpen,
  isSidebarCollapsed,
  isMobile,
  onNavigate,
}: NavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  const { theme, toggleTheme, mounted } = useTheme();
  const { user, logout } = useAuth();

  // Debounced global search across modules, citizens, appointments
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await globalSearchService.search(q, user?.hospital_id, user?.role);
        setSearchResults(results);
        setIsSearchOpen(true);
      } catch (e) {
        console.warn('Global search error:', e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.hospital_id, user?.role]);

  // Click outside to dismiss search results popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target) &&
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (item: GlobalSearchResultItem) => {
    if (onNavigate) {
      onNavigate(item.targetPage as PageType, item.payload);
    } else {
      router.push('/dashboard');
    }
    setSearchQuery('');
    setIsSearchOpen(false);
    setShowMobileSearch(false);
  };

  const unreadCount = staticNotifications.filter((n) => !n.read).length;

  const displayName = user?.name || 'Hospital Staff';
  const displayRole = user?.role || user?.designation || 'Staff';
  const displayHospitalName = user?.hospital_name || 'Hospital not assigned';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return '!';
      case 'warning':
        return '!';
      case 'success':
        return 'OK';
      default:
        return 'i';
    }
  };

  const renderSearchResultsList = () => {
    if (isSearching) {
      return (
        <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          <span>Searching records &amp; modules...</span>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className="p-5 text-center text-sm text-slate-500 dark:text-slate-400">
          No results found for &ldquo;<span className="font-medium text-slate-700 dark:text-slate-300">{searchQuery}</span>&rdquo;
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Try searching by citizen name, Health ID, phone, or module name.
          </p>
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
          <span>Found {searchResults.length} result{searchResults.length > 1 ? 's' : ''}</span>
          <span className="text-[10px] text-slate-400">Click to navigate</span>
        </div>
        {searchResults.map((item) => {
          const isModule = item.type === 'module';
          const isPatient = item.type === 'patient';
          const isAppointment = item.type === 'appointment';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectResult(item)}
              className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-colors group cursor-pointer"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  isModule && "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300",
                  isPatient && "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300",
                  isAppointment && "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300"
                )}
              >
                {isModule && <Compass className="h-4 w-4" />}
                {isPatient && <User className="h-4 w-4" />}
                {isAppointment && <CalendarDays className="h-4 w-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {item.title}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                      isModule && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
                      isPatient && "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
                      isAppointment && "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                    )}
                  >
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>

              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-30 h-16 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-slate-900/95 dark:border-slate-700",
        !isMobile && !isSidebarCollapsed && "lg:left-64",
        !isMobile && isSidebarCollapsed && "lg:left-16"
      )}
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Menu Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="h-9 w-9 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40"
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
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-600 to-amber-400 shadow-lg shadow-emerald-900/20">
              <Hospital className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                Hospital Management Portal
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Tech-Lifter Clinical Suite
              </span>
            </div>
          </div>

          {/* Government Badge */}
          <Badge
            variant="outline"
            className="hidden md:flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            <Shield className="h-3 w-3" />
            <span className="text-xs font-medium">Secure Portal</span>
          </Badge>
        </div>

        {/* Center Section - Search */}
        <div ref={searchContainerRef} className="hidden md:flex flex-1 justify-center px-8 max-w-xl relative">
          <div className="relative w-full">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            )}
            <Input
              type="text"
              placeholder="Search patients, appointments, modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setIsSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsSearchOpen(false);
              }}
              className="h-10 w-full rounded-2xl border-stone-200 bg-white/80 pl-10 pr-9 shadow-sm focus:bg-white focus:border-emerald-500 dark:border-emerald-900/70 dark:bg-stone-950/40 dark:text-white dark:placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Dropdown Results */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95">
                {renderSearchResultsList()}
              </div>
            )}
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
            className="h-9 w-9 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40"
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
                      !notification.read && 'bg-emerald-50/70 dark:bg-emerald-950/25'
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-50 px-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">{getNotificationIcon(notification.type)}</span>
                      <span className="text-sm font-medium flex-1 dark:text-white">{notification.title}</span>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
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
              <DropdownMenuItem className="text-center font-medium text-primary dark:text-emerald-300">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 via-teal-600 to-amber-400 text-white font-medium text-sm shadow-sm shadow-emerald-900/25">
                  {avatarInitial}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-700 dark:text-white">
                    {displayName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {displayRole}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dark:bg-slate-800 dark:border-slate-700">
              <DropdownMenuLabel className="dark:text-white">
                <div className="flex flex-col">
                  <span className="font-medium">{displayName}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    {user?.email || 'Email not available'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    {displayRole}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-slate-700" />
              <div className="px-2 py-2 text-xs text-slate-500 dark:text-slate-400">
                <p>{displayHospitalName}</p>
                <p>{user?.designation || 'Designation not available'}</p>
                <p>{user?.department || 'Department not available'}</p>
              </div>
              <DropdownMenuSeparator className="dark:bg-slate-700" />
              <DropdownMenuItem
                className="gap-2 dark:text-white dark:focus:bg-slate-700"
                onClick={() => handleNavigate('/profile')}
              >
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 dark:text-white dark:focus:bg-slate-700"
                onClick={() => handleNavigate('/settings')}
              >
                <Settings className="h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 dark:text-white dark:focus:bg-slate-700"
                onClick={() => handleNavigate('/help')}
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-slate-700" />
              <div className="px-2 pb-2 text-xs text-slate-500 dark:text-slate-400">
                <p>{user?.phone || 'Phone not available'}</p>
              </div>
              <DropdownMenuItem
                className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 dark:focus:bg-slate-700"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div ref={mobileSearchContainerRef} className="md:hidden border-t p-3 dark:border-slate-700 dark:bg-slate-900 relative">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            )}
            <Input
              type="text"
              placeholder="Search patients, appointments, modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setIsSearchOpen(true);
              }}
              className="w-full pl-10 pr-9 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile Dropdown Results */}
          {isSearchOpen && (
            <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
              {renderSearchResultsList()}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
