import {
  Utensils,
  Car,
  Hotel,
  Film,
  ShoppingCart,
  Zap,
  ShoppingBag,
  Receipt,
} from 'lucide-react';
import type { ExpenseCategory } from '../../types/transaction';

export interface CategoryIconProps {
  category: ExpenseCategory;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryIcon({ category, className = '', size = 'md' }: CategoryIconProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-10 h-10 p-2.5',
    lg: 'w-12 h-12 p-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const configs: Record<
    ExpenseCategory,
    { icon: typeof Utensils; bg: string; color: string }
  > = {
    food: { icon: Utensils, bg: 'bg-amber-100', color: 'text-amber-700' },
    transport: { icon: Car, bg: 'bg-blue-100', color: 'text-blue-700' },
    lodging: { icon: Hotel, bg: 'bg-indigo-100', color: 'text-indigo-700' },
    entertainment: { icon: Film, bg: 'bg-purple-100', color: 'text-purple-700' },
    groceries: { icon: ShoppingCart, bg: 'bg-emerald-100', color: 'text-emerald-700' },
    utilities: { icon: Zap, bg: 'bg-orange-100', color: 'text-orange-700' },
    shopping: { icon: ShoppingBag, bg: 'bg-rose-100', color: 'text-rose-700' },
    general: { icon: Receipt, bg: 'bg-slate-100', color: 'text-slate-700' },
  };

  const config = configs[category] || configs.general;
  const IconComponent = config.icon;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl ${config.bg} ${config.color} ${sizeClasses[size]} ${className}`}
    >
      <IconComponent className={iconSizes[size]} />
    </div>
  );
}
