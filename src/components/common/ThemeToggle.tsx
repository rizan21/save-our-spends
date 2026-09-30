import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { effectiveTheme, toggleTheme } = useTheme();

  const isDark = effectiveTheme === 'dark';

  const sizeClasses = size === 'sm' ? 'p-1.5' : 'p-2';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`rounded-xl border border-transparent transition-all cursor-pointer select-none flex items-center justify-center ${
        isDark
          ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-800 hover:border-slate-700/80'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 hover:border-slate-200/80'
      } ${sizeClasses} ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className={`${iconSize} transition-transform duration-200 rotate-0 hover:rotate-45 text-amber-400`} />
      ) : (
        <Moon className={`${iconSize} transition-transform duration-200 -rotate-12 hover:rotate-0 text-slate-600`} />
      )}
    </button>
  );
}
