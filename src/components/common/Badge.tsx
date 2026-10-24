import React from 'react';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'emerald' | 'slate';
  className?: string;
}

const variants = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
  slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export function Badge({
  children,
  variant = 'slate',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-0.5 font-medium rounded-full border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
