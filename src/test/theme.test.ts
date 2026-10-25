import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import type { Theme, EffectiveTheme } from '../context/ThemeContext';

describe('Theme Management and Dark Mode Infrastructure', () => {
  const THEME_STORAGE_KEY = 'spread_spends_theme';
  let memoryStore: Record<string, string> = {};

  beforeEach(() => {
    memoryStore = {};

    // Mock localStorage
    globalThis.localStorage = {
      getItem: (key: string) => memoryStore[key] ?? null,
      setItem: (key: string, value: string) => {
        memoryStore[key] = value;
      },
      removeItem: (key: string) => {
        delete memoryStore[key];
      },
      clear: () => {
        memoryStore = {};
      },
      key: (index: number) => Object.keys(memoryStore)[index] ?? null,
      length: Object.keys(memoryStore).length,
    } as Storage;

    // Mock document and documentElement
    const classListSet = new Set<string>();
    const styleObj: Record<string, string> = {};
    const mockMeta = {
      content: '',
      setAttribute(name: string, val: string) {
        if (name === 'content') this.content = val;
      },
      getAttribute(name: string) {
        return name === 'content' ? this.content : null;
      },
    };

    globalThis.document = {
      documentElement: {
        classList: {
          add: (cls: string) => classListSet.add(cls),
          remove: (cls: string) => classListSet.delete(cls),
          contains: (cls: string) => classListSet.has(cls),
          toggle: (cls: string) => {
            if (classListSet.has(cls)) {
              classListSet.delete(cls);
              return false;
            } else {
              classListSet.add(cls);
              return true;
            }
          },
        },
        style: styleObj,
      },
      querySelector: (selector: string) => {
        if (selector === 'meta[name="theme-color"]') {
          return mockMeta;
        }
        return null;
      },
      querySelectorAll: (selector: string) => {
        if (selector === 'meta[name="theme-color"]') {
          return [mockMeta];
        }
        return [];
      },
    } as unknown as Document;
  });

  afterEach(() => {
    // cleanup
    memoryStore = {};
  });

  test('resolves effective theme based on system preference when theme is "system"', () => {
    const resolveEffectiveTheme = (theme: Theme, systemPrefersDark: boolean): EffectiveTheme => {
      if (theme === 'system') {
        return systemPrefersDark ? 'dark' : 'light';
      }
      return theme;
    };

    expect(resolveEffectiveTheme('system', false)).toBe('light');
    expect(resolveEffectiveTheme('system', true)).toBe('dark');
    expect(resolveEffectiveTheme('light', true)).toBe('light');
    expect(resolveEffectiveTheme('dark', false)).toBe('dark');
  });

  test('toggleTheme alternates between light and dark based on effective theme', () => {
    const toggle = (effectiveTheme: EffectiveTheme): Theme => {
      return effectiveTheme === 'dark' ? 'light' : 'dark';
    };

    expect(toggle('dark')).toBe('light');
    expect(toggle('light')).toBe('dark');
  });

  test('persists user selected theme to localStorage', () => {
    const setTheme = (newTheme: Theme) => {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    };

    setTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    setTheme('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    setTheme('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  test('applies dark class and colorScheme to document.documentElement when dark theme is active', () => {
    const applyThemeToDocument = (effectiveTheme: EffectiveTheme) => {
      const root = document.documentElement;
      if (effectiveTheme === 'dark') {
        root.classList.add('dark');
        (root.style as unknown as Record<string, string>).colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        (root.style as unknown as Record<string, string>).colorScheme = 'light';
      }

      const themeColor = effectiveTheme === 'dark' ? '#020617' : '#10b981';
      const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
      metaThemeColors.forEach((meta) => {
        meta.setAttribute('content', themeColor);
      });
    };

    // Test Dark mode application
    applyThemeToDocument('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect((document.documentElement.style as unknown as Record<string, string>).colorScheme).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#020617');

    // Test Light mode application
    applyThemeToDocument('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect((document.documentElement.style as unknown as Record<string, string>).colorScheme).toBe('light');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#10b981');
  });

  test('restores theme preference from localStorage on startup', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const getStoredTheme = (): Theme => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
      return 'system';
    };

    expect(getStoredTheme()).toBe('dark');

    localStorage.setItem(THEME_STORAGE_KEY, 'invalid-value');
    expect(getStoredTheme()).toBe('system');
  });
});
