import { useState } from 'react';
import type { Expense, ExpenseCategory } from '../../../types/transaction';
import { formatCurrency } from '../../../core/splitCalculator';
import { CategoryIcon } from '../../../components/common/CategoryIcon';
import { Button } from '../../../components/common/Button';
import { Plus, PieChart as PieChartIcon } from 'lucide-react';
import { CATEGORY_META } from '../../../constants/categories';

export interface CategoryPieChartProps {
  expenses: Expense[];
  currency: string;
  onOpenAddExpense?: () => void;
}

interface CategorySpending {
  category: ExpenseCategory;
  name: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
  barColor: string;
}

export function CategoryPieChart({
  expenses,
  currency,
  onOpenAddExpense,
}: CategoryPieChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<ExpenseCategory | null>(null);

  const toggleCategory = (cat: ExpenseCategory) => {
    setHoveredCategory((prev) => (prev === cat ? null : cat));
  };

  // Filter active expenses
  const activeExpenses = expenses.filter((e) => e.status === 'ACTIVE');
  const totalSpend = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = activeExpenses.length > 0 ? totalSpend / activeExpenses.length : 0;

  // Group by category
  const categoryMap = new Map<ExpenseCategory, { amount: number; count: number }>();
  for (const exp of activeExpenses) {
    const prev = categoryMap.get(exp.category) || { amount: 0, count: 0 };
    categoryMap.set(exp.category, {
      amount: prev.amount + exp.amount,
      count: prev.count + 1,
    });
  }

  const categoryBreakdown: CategorySpending[] = Array.from(categoryMap.entries())
    .map(([cat, data]) => {
      const meta = CATEGORY_META[cat] || CATEGORY_META.general;
      const percentage = totalSpend > 0 ? (data.amount / totalSpend) * 100 : 0;
      return {
        category: cat,
        name: meta.name,
        amount: data.amount,
        count: data.count,
        percentage,
        color: meta.hex,
        barColor: meta.barClass,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Geometry for SVG Donut (optimized for mobile touch & visibility)
  const radius = 66;
  const circumference = 2 * Math.PI * radius; // ~414.69
  const strokeWidth = 22;
  const hoveredStrokeWidth = 26;

  const slices = categoryBreakdown.map((item, index) => {
    const prevPercent = categoryBreakdown
      .slice(0, index)
      .reduce((sum, c) => sum + c.percentage, 0);
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((prevPercent / 100) * circumference);
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeCategory = hoveredCategory
    ? categoryBreakdown.find((c) => c.category === hoveredCategory)
    : null;

  if (activeExpenses.length === 0 || totalSpend === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Spending by Category</h2>
        </div>
        <div className="text-center py-8 space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
            <PieChartIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No expenses logged yet</p>
          </div>
          {onOpenAddExpense && (
            <div className="pt-2">
              <Button size="sm" onClick={onOpenAddExpense} className="gap-1.5 min-h-[38px]">
                <Plus className="w-4 h-4" />
                <span>Add First Expense</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <PieChartIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Spending by Category</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
        {/* SVG Donut Chart */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90 transform cursor-pointer"
              viewBox="0 0 180 180"
              aria-label="Expense Category Donut Chart"
            >
              {/* Background ring */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                strokeWidth={strokeWidth}
              />
              {/* Slices */}
              {slices.map((slice) => {
                const isHovered = hoveredCategory === slice.category;
                return (
                  <circle
                    key={slice.category}
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? hoveredStrokeWidth : strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    className="transition-all duration-200 cursor-pointer touch-manipulation"
                    onClick={() => toggleCategory(slice.category)}
                    onMouseEnter={() => setHoveredCategory(slice.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    opacity={hoveredCategory && !isHovered ? 0.45 : 1}
                  />
                );
              })}
            </svg>

            {/* Center Information */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 pointer-events-none transition-all">
              {activeCategory ? (
                <>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 max-w-[130px] line-clamp-2 leading-tight">
                    {activeCategory.name}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(activeCategory.amount, currency)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {activeCategory.percentage.toFixed(1)}% of total
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Total Spending
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(totalSpend, currency)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Avg {formatCurrency(avgExpense, currency)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown Table / Cards */}
        <div className="md:col-span-7 space-y-2.5">
          <div className="space-y-2 max-h-none md:max-h-80 overflow-visible md:overflow-y-auto pr-0 md:pr-1">
            {categoryBreakdown.map((item) => {
              const isHovered = hoveredCategory === item.category;
              return (
                <div
                  key={item.category}
                  onClick={() => toggleCategory(item.category)}
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer touch-manipulation ${
                    isHovered
                      ? 'bg-slate-50 dark:bg-slate-800 border-emerald-400 dark:border-emerald-500 shadow-xs ring-1 ring-emerald-400/30'
                      : 'bg-white dark:bg-slate-850/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryIcon category={item.category} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount, currency)}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Percentage Progress Bar */}
                  <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${item.barColor}`}
                      style={{ width: `${Math.min(Math.max(item.percentage, 2), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
