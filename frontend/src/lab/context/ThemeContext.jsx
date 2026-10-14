import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'samved-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('smc-hospital-theme') || localStorage.getItem('pharma-dashboard-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;

      if (theme === 'dark') {
        document.documentElement.classList.add('dark', 'theme-dark');
        document.documentElement.classList.remove('theme-light', 'light');
        document.body?.classList.add('dark', 'theme-dark');
        document.body?.classList.remove('theme-light', 'light');
      } else {
        document.documentElement.classList.remove('dark', 'theme-dark');
        document.documentElement.classList.add('theme-light', 'light');
        document.body?.classList.remove('dark', 'theme-dark');
        document.body?.classList.add('theme-light', 'light');
      }

      localStorage.setItem(STORAGE_KEY, theme);
      localStorage.setItem('smc-hospital-theme', theme);
      localStorage.setItem('pharma-dashboard-theme', theme);

      // Notify root Next.js ThemeProvider of the change
      window.dispatchEvent(new CustomEvent('theme-change'));
    }
  }, [theme]);

  // Listen for theme-change events triggered from other components
  useEffect(() => {
    const handleThemeChange = () => {
      const active = localStorage.getItem('smc-hospital-theme') || localStorage.getItem(STORAGE_KEY);
      if (active === 'light' || active === 'dark') {
        setTheme((prev) => (prev !== active ? active : prev));
      }
    };

    window.addEventListener('theme-change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
      setTheme,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
