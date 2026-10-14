import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'pharma-dashboard-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // 1. Set data-theme attribute on <html>
    document.documentElement.dataset.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    // 2. Add / remove 'dark' class on <html> for Tailwind CSS dark: variants
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body?.classList.add('dark');
      document.body?.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body?.classList.remove('dark');
      document.body?.classList.add('light');
    }

    // 3. Set native browser color-scheme
    document.documentElement.style.colorScheme = theme;

    // 4. Save to localStorage
    window.localStorage.setItem(STORAGE_KEY, theme);
    window.localStorage.setItem('smc-hospital-theme', theme);
    window.localStorage.setItem('samved-theme', theme);

    // 5. Dispatch theme-change event for root Next.js ThemeProvider
    window.dispatchEvent(new CustomEvent('theme-change'));
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
