import { useState, type FormEvent } from 'react';
import type { Group } from '../../../types/group';
import type { Expense, ExpenseCategory } from '../../../types/transaction';
import type { GroupFinancialSummary } from '../../../types/balance';
import { formatCurrency } from '../../../core/splitCalculator';
import { formatTransactionDateTime } from '../../../core/dateTime';
import { CategoryPieChart } from './CategoryPieChart';
import { CATEGORY_META } from '../../../constants/categories';
import { CategoryIcon } from '../../../components/common/CategoryIcon';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { useGroupContext } from '../GroupContext';
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

export interface SummarySectionProps {
  group?: Group;
  expenses?: Expense[];
  financialSummary?: GroupFinancialSummary | null;
  onNavigateToExpenses?: () => void;
  onOpenAddExpense?: () => void;
  onViewExpense?: (expense: Expense) => void;
  onUpdateDescription?: (description: string) => Promise<unknown>;
  isUpdatingDescription?: boolean;
}

export function SummarySection(props: SummarySectionProps) {
  const context = useGroupContext();

  const group = props.group || context?.group;
  const expenses = props.expenses || context?.expenses || [];
  const financialSummary = props.financialSummary !== undefined ? props.financialSummary : (context?.financialSummary || null);
  const onNavigateToExpenses = props.onNavigateToExpenses || (() => context?.onNavigateToTab('expenses'));
  const onOpenAddExpense = props.onOpenAddExpense || (() => context?.openAddExpense());
  const onViewExpense = props.onViewExpense || (context ? (exp: Expense) => context.viewTransactionHistory({ type: 'EXPENSE', data: exp }) : undefined);
  const onUpdateDescription = props.onUpdateDescription || ((desc: string) => context?.updateDescription(desc) || Promise.resolve());
  const isUpdatingDescription = props.isUpdatingDescription !== undefined ? props.isUpdatingDescription : (context?.isUpdatingDescription || false);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState(group?.description || '');
  const [descError, setDescError] = useState<string | null>(null);

  if (!group) return null;

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

  const topCategoryName = topCategory
    ? CATEGORY_META[topCategory.category as ExpenseCategory]?.name || topCategory.category
    : null;

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
    <div className="space-y-5 sm:space-y-6">
      {/* 1. Group Description & Details Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Group Overview
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
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
                  className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                {descError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{descError}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" isLoading={isUpdatingDescription} className="gap-1 min-h-[36px]">
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelDescription}
                    disabled={isUpdatingDescription}
                    className="gap-1 min-h-[36px]"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                {group.description ? (
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                    {group.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all self-start cursor-pointer shrink-0 min-h-[34px]"
              title="Edit group description"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{group.description ? 'Edit' : 'Add Description'}</span>
            </button>
          )}
        </div>

        {/* Group Quick Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <Badge variant="slate" className="max-w-full">
            Owner: <strong className="ml-1 text-slate-700 dark:text-slate-200 truncate inline-block max-w-[200px] sm:max-w-none align-bottom" title={group.ownerEmail}>{group.ownerEmail}</strong>
          </Badge>
          <Badge variant="slate">
            Currency: <strong className="ml-1 text-slate-700 dark:text-slate-200">{currency}</strong>
          </Badge>
        </div>
      </div>

      {/* 2. Key Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Spending */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Spending</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalSpending, currency)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeExpenses.length} {activeExpenses.length === 1 ? 'expense' : 'expenses'} logged
            </div>
          </div>
        </div>

        {/* Top Spending Category */}
        <div className="col-span-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">Top Category</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="min-w-0">
            {topCategory ? (
              <>
                <div
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
                  title={topCategoryName || undefined}
                >
                  {topCategoryName}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {formatCurrency(topCategory.amount, currency)} (
                  {totalSpending > 0
                    ? ((topCategory.amount / totalSpending) * 100).toFixed(0)
                    : 0}
                  %)
                </div>
              </>
            ) : (
              <>
                <div className="text-base sm:text-lg font-bold text-slate-400 dark:text-slate-500">None yet</div>
                <div className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">No category data</div>
              </>
            )}
          </div>
        </div>

        {/* Average Expense */}
        <div className="col-span-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">Avg Expense</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {formatCurrency(averageExpense, currency)}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Per transaction
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Expenses</h3>
          </div>
          <button
            onClick={onNavigateToExpenses}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer py-1 -my-1"
          >
            <span>View All ({activeExpenses.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">No expenses logged in this group yet.</p>
            <Button size="sm" variant="outline" onClick={onOpenAddExpense} className="gap-1 min-h-[38px]">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentExpenses.map((exp) => {
              const payerEmail = Object.keys(exp.paidBy || {})[0];
              const payerMember = group.members.find(
                (m) => m.email.toLowerCase() === payerEmail?.toLowerCase()
              );
              const payerName = payerMember?.name || payerEmail?.split('@')[0] || 'Member';

              const dt = formatTransactionDateTime(exp.date, exp.createdAt);

              return (
                <div
                  key={exp.id}
                  role={onViewExpense ? 'button' : undefined}
                  tabIndex={onViewExpense ? 0 : undefined}
                  onClick={() => onViewExpense?.(exp)}
                  onKeyDown={(e) => {
                    if (onViewExpense && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onViewExpense(exp);
                    }
                  }}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border border-transparent bg-slate-50/60 dark:bg-slate-850/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all text-left ${
                    onViewExpense ? 'cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20' : ''
                  }`}
                  aria-label={onViewExpense ? `View history and details for ${exp.description}` : undefined}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <CategoryIcon category={exp.category} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {exp.description}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5 min-w-0">
                        <span className="font-semibold text-slate-600 dark:text-slate-300 shrink-0">{dt.date}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-normal shrink-0">{dt.time}</span>
                        <span className="shrink-0">•</span>
                        <span className="inline-flex items-center gap-1 min-w-0">
                          {payerMember && (
                            <UserAvatar name={payerName} picture={payerMember.picture} size="xs" />
                          )}
                          <span className="truncate max-w-[100px] sm:max-w-[200px]">Paid by {payerName}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white shrink-0 ml-2">
                    {formatCurrency(exp.amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:flex sm:justify-end gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToExpenses}
            className="gap-1.5 text-xs min-h-[38px] sm:min-h-[34px]"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={onOpenAddExpense}
            className="gap-1.5 text-xs min-h-[38px] sm:min-h-[34px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Re-export as GroupOverview for backward compatibility
export { SummarySection as GroupOverview };
