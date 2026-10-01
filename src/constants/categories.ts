import type { ExpenseCategory } from '../types/transaction';

export interface CategoryMetadata {
  name: string;
  hex: string;
  barClass: string;
}

export const CATEGORY_META: Record<ExpenseCategory, CategoryMetadata> = {
  food: { name: 'Food & Dining', hex: '#f59e0b', barClass: 'bg-amber-500' },
  transport: { name: 'Transportation', hex: '#3b82f6', barClass: 'bg-blue-500' },
  lodging: { name: 'Lodging & Accommodation', hex: '#6366f1', barClass: 'bg-indigo-500' },
  entertainment: { name: 'Entertainment', hex: '#a855f7', barClass: 'bg-purple-500' },
  groceries: { name: 'Groceries', hex: '#10b981', barClass: 'bg-emerald-500' },
  utilities: { name: 'Bills & Utilities', hex: '#f97316', barClass: 'bg-orange-500' },
  shopping: { name: 'Shopping', hex: '#f43f5e', barClass: 'bg-rose-500' },
  general: { name: 'General & Others', hex: '#64748b', barClass: 'bg-slate-500' },
};
