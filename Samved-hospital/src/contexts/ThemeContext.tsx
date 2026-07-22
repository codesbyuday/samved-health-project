'use client';

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key
const THEME_STORAGE_KEY = 'smc-hospital-theme';

// Subscribe to storage changes
const subscribeToStorage = (callback: () => void) => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) {
      callback();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Also listen for custom theme change events (for same-tab updates)
  window.addEventListener('theme-change', callback);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('theme-change', callback);
  };
};

// Get the current theme from storage or system preference
const getThemeSnapshot = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (savedTheme) return savedTheme;
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

// Server snapshot always returns 'light' to avoid hydration mismatch
const getServerThemeSnapshot = (): Theme => 'light';

// Check if component is mounted (for conditional rendering)
const getMountedSnapshot = (): boolean => {
  return typeof window !== 'undefined';
};

const getServerMountedSnapshot = (): boolean => false;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use useSyncExternalStore for hydration-safe theme
  const theme = useSyncExternalStore(subscribeToStorage, getThemeSnapshot, getServerThemeSnapshot);
  const mounted = useSyncExternalStore(() => () => {}, getMountedSnapshot, getServerMountedSnapshot);
  
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('theme-change'));
    
    // Apply theme to document immediately
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);
  
  // Apply theme class to document when theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme, mounted]);
  
  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        window.dispatchEvent(new CustomEvent('theme-change'));
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
