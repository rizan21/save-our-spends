# Context

## Overview
Provides React context and provider infrastructure for application-wide theme state management, supporting system-preference detection, local persistence, real-time media query listeners, and HTML document element styling (Tailwind dark mode and meta theme-color).

## Interface
- `Theme`: Type representing user theme setting (`'light' | 'dark' | 'system'`).
- `EffectiveTheme`: Type representing active resolved theme (`'light' | 'dark'`).
- `ThemeContextValue`: Interface for theme context value containing `theme`, `effectiveTheme`, `setTheme`, and `toggleTheme`.
- `ThemeContext`: React Context instance holding `ThemeContextValue | null`.
- `useTheme()`: Hook returning `ThemeContextValue`; throws if called outside `ThemeProvider`.
- `ThemeProvider({ children })`: React provider component wrapping children with `ThemeContext`.

## Invariants
- `useTheme` must be invoked within a `ThemeProvider` subtree or an Error is thrown.
- `effectiveTheme` strictly evaluates to system preference when theme is `'system'`, or mirrors theme directly when `'light'` or `'dark'`.
- `document.documentElement` classList and `style.colorScheme` strictly reflect `effectiveTheme`.
- Theme persistence in localStorage under `'spread_spends_theme'` strictly stores valid `Theme` values (`'light'`, `'dark'`, `'system'`) with fallback to `'system'`.

## Side Effects
- Reads and persists theme configuration to `localStorage` under `'spread_spends_theme'`.
- Mutates DOM `document.documentElement` classList (adds/removes `'dark'`) and `style.colorScheme`.
- Updates `document.querySelector('meta[name="theme-color"]')` content attribute between `'#0f172a'` and `'#10b981'`.
- Attaches and cleans up mediaQuery change event listeners on `window.matchMedia('(prefers-color-scheme: dark)')`.

## Verification
- Run: `bun test`
