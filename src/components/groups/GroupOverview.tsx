import { useState, type FormEvent } from 'react';
import type { Group } from '../../types/group';
import type { Expense } from '../../types/transaction';
import type { GroupFinancialSummary } from '../../types/balance';
import { formatCurrency } from '../../core/splitCalculator';
import { CategoryPieChart } from './CategoryPieChart';
import { CategoryIcon } from '../common/CategoryIcon';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Wallet,
  Receipt,
  Pencil,
  Check,
  X,
  ArrowRight,
  Plus,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export interface GroupOverviewProps {
  group: Group;
  expenses: Expense[];
  financialSummary: GroupFinancialSummary | null;
  onNavigateToExpenses: () => void;
  onOpenAddExpense: () => void;
  onUpdateDescription: (description: string) => Promise<void>;
  isUpdatingDescription?: boolean;
}

export function GroupOverview({
  group,
  expenses,
  financialSummary,
  onNavigateToExpenses,
  onOpenAddExpense,
  onUpdateDescription,
  isUpdatingDescription = false,
}: GroupOverviewProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState(group.description || '');
  const [descError, setDescError] = useState<string | null>(null);

  const currency = financialSummary?.currency || group.currency || 'USD';
  const totalSpending = financialSummary?.totalSpending || 0;
  const activeExpenses = expenses.filter((e) => e.status === 'ACTIVE');

  // Calculate top spending category
  const categoryTotals: Record<string, number> = {};
  for (const exp of activeExpenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  }
  let topCategory: { category: string; amount: number } | null = null;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (!topCategory || amt > topCategory.amount) {
      topCategory = { category: cat, amount: amt };
    }
  }

  // Calculate average expense
  const averageExpense = activeExpenses.length > 0 ? totalSpending / activeExpenses.length : 0;

  // Recent 3 expenses
  const recentExpenses = [...activeExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const handleSaveDescription = async (e: FormEvent) => {
    e.preventDefault();
    setDescError(null);
    try {
      await onUpdateDescription(descriptionInput.trim());
      setIsEditingDescription(false);
    } catch (err) {
      setDescError(err instanceof Error ? err.message : 'Failed to update description');
    }
  };

  const handleCancelDescription = () => {
    setDescriptionInput(group.description || '');
    setIsEditingDescription(false);
    setDescError(null);
  };

  const formattedDate = new Date(group.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* 1. Group Description & Details Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Group Overview
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Created {formattedDate}
              </span>
            </div>

            {isEditingDescription ? (
              <form onSubmit={handleSaveDescription} className="space-y-3 pt-1">
                <textarea
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="What is this group for? Add a short description (e.g., Goa trip details, room rules, split notes)..."
                  rows={3}
                  className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                {descError && (
                  <p className="text-xs text-rose-600">{descError}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" isLoading={isUpdatingDescription} className="gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelDescription}
                    disabled={isUpdatingDescription}
                    className="gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                {group.description ? (
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    {group.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    No description provided. Add a short note so members understand what this group is for.
                  </p>
                )}
              </div>
            )}
          </div>

          {!isEditingDescription && (
            <button
              onClick={() => {
                setDescriptionInput(group.description || '');
                setIsEditingDescription(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all self-start cursor-pointer shrink-0"
              title="Edit group description"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{group.description ? 'Edit' : 'Add Description'}</span>
            </button>
          )}
        </div>

        {/* Group Quick Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
          <Badge variant="slate">
            Owner: <strong className="ml-1 text-slate-700">{group.ownerEmail}</strong>
          </Badge>
          <Badge variant="slate">
            Currency: <strong className="ml-1 text-slate-700">{currency}</strong>
          </Badge>
        </div>
      </div>

      {/* 2. Key Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Spending */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Spending</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {formatCurrency(totalSpending, currency)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {activeExpenses.length} {activeExpenses.length === 1 ? 'expense' : 'expenses'} logged
            </div>
          </div>
        </div>

        {/* Top Spending Category */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Category</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            {topCategory ? (
              <>
                <div className="text-xl font-bold text-slate-900 truncate capitalize">
                  {topCategory.category}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatCurrency(topCategory.amount, currency)} (
                  {totalSpending > 0
                    ? ((topCategory.amount / totalSpending) * 100).toFixed(0)
                    : 0}
                  %)
                </div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-slate-400">None yet</div>
                <div className="text-xs text-slate-400 mt-0.5">No category data</div>
              </>
            )}
          </div>
        </div>

        {/* Average Expense */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Expense</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {formatCurrency(averageExpense, currency)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Per logged transaction
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Spending Donut Chart & Breakdown */}
      <CategoryPieChart
        expenses={expenses}
        currency={currency}
        onOpenAddExpense={onOpenAddExpense}
      />

      {/* 4. Recent Transactions Snapshot */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Expenses</h3>
          </div>
          <button
            onClick={onNavigateToExpenses}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All ({activeExpenses.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs text-slate-500">No expenses logged in this group yet.</p>
            <Button size="sm" variant="outline" onClick={onOpenAddExpense} className="gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon category={exp.category} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {exp.description}
                    </div>
                    <div className="text-xs text-slate-400">
                      {exp.date} • Paid by {Object.keys(exp.paidBy || {})[0]?.split('@')[0] || 'Member'}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-slate-900 shrink-0">
                  {formatCurrency(exp.amount, currency)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToExpenses}
            className="gap-1.5 text-xs"
          >
            <span>View All Expenses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={onOpenAddExpense}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
