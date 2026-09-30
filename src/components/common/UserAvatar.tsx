import { useState } from 'react';

export interface UserAvatarProps {
  name: string;
  picture?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-xl sm:w-20 sm:h-20 sm:text-2xl',
};

// Consistent soft background palette for initials fallback
const bgColors = [
  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
  'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
];

function getInitialsColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function UserAvatar({
  name,
  picture,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const initial = (name ? name.trim().charAt(0) : '?').toUpperCase();

  if (picture && !imageError) {
    return (
      <img
        key={picture}
        src={picture}
        alt={name || 'User profile'}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
        className={`${sizeClass} rounded-full object-cover border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0 ${className}`}
      />
    );
  }

  const colorClass = getInitialsColor(name || '');

  return (
    <div
      className={`${sizeClass} rounded-full font-bold flex items-center justify-center border shrink-0 ${colorClass} ${className}`}
      aria-label={name}
    >
      {initial}
    </div>
  );
}
