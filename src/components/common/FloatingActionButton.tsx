import React from 'react';
import { Plus } from 'lucide-react';

export interface FloatingActionButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  tooltipText?: string;
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  className?: string;
  disabled?: boolean;
  tabIndex?: number;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export function FloatingActionButton({
  onClick,
  ariaLabel = 'Add expense',
  tooltipText = 'Add expense',
  icon: Icon = Plus,
  className = '',
  disabled = false,
  tabIndex = 0,
  'aria-hidden': ariaHidden,
}: FloatingActionButtonProps) {
  return (
    <div
      className={`fixed right-6 sm:right-8 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(2rem+env(safe-area-inset-bottom))] z-40 ${className}`.trim()}
    >
      <div className="relative group">
        {/* Desktop Tooltip */}
        {tooltipText && (
          <div
            role="tooltip"
            className="hidden sm:group-hover:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 items-center px-2.5 py-1 text-xs font-semibold text-white bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-xs rounded-lg shadow-md whitespace-nowrap pointer-events-none select-none transition-opacity duration-150"
          >
            {tooltipText}
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900/90 dark:border-l-slate-800/95" />
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          tabIndex={tabIndex}
          aria-hidden={ariaHidden}
          aria-label={ariaLabel}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/40 hover:shadow-xl focus:outline-none focus:ring-3 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <Icon className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
