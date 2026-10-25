import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ThemeContext,
  type Theme,
  type EffectiveTheme,
  type ThemeContextValue,
} from './ThemeContext';

const THEME_STORAGE_KEY = 'spread_spends_theme';

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Ignore localStorage access failures
  }
  return 'system';
}

function applyThemeToDocument(effectiveTheme: EffectiveTheme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  // Update mobile status bar and navigation bar theme color
  const themeColor = effectiveTheme === 'dark' ? '#020617' : '#10b981';
  const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
  metaThemeColors.forEach((meta) => {
    meta.setAttribute('content', themeColor);
  });

  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  if (metaColorScheme) {
    metaColorScheme.setAttribute('content', effectiveTheme === 'dark' ? 'dark' : 'light');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemDark, setSystemDark] = useState<boolean>(getSystemPrefersDark);

  // Calculate effective resolved theme
  const effectiveTheme: EffectiveTheme = useMemo(() => {
    if (theme === 'system') {
      return systemDark ? 'dark' : 'light';
    }
    return theme;
  }, [theme, systemDark]);

  // Keep DOM updated with effective theme
  useEffect(() => {
    applyThemeToDocument(effectiveTheme);
  }, [effectiveTheme]);

  // Listen to OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    // Modern browsers support addEventListener, fallback for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if ('addListener' in mediaQuery) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    // If currently dark (either via system or explicit), switch to light
    // If currently light, switch to dark
    const nextTheme: Theme = effectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [effectiveTheme, setTheme]);

  const value: ThemeContextValue = useMemo(
    () => ({
      theme,
      effectiveTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, effectiveTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
