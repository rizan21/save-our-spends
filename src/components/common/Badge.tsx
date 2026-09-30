import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
  blue: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60',
  slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export function Badge({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
