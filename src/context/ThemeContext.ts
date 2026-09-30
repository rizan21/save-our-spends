import { createContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
