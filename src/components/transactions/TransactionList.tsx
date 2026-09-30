import { useState } from 'react';
import { TransactionItem } from './TransactionItem';
import { Button } from '../common/Button';
import { UserAvatar } from '../common/UserAvatar';
import { Receipt, Plus, HandCoins } from 'lucide-react';
import type { Expense, Settlement } from '../../types/transaction';
import type { SimplifiedDebt } from '../../types/balance';
import type { Member } from '../../types/group';
import { formatCurrency } from '../../core/splitCalculator';

export interface TransactionListProps {
  expenses: Expense[];
  settlements: Settlement[];
  currentUserEmail: string;
  currency: string;
  members?: Member[];
  simplifiedDebts?: SimplifiedDebt[];
  onOpenAddExpense: () => void;
  onSettleDebt?: (debt: SimplifiedDebt) => void;
  onEditExpense?: (expense: Expense) => void;
  onEditSettlement?: (settlement: Settlement) => void;
  onViewHistory?: (item: { type: 'EXPENSE'; data: Expense } | { type: 'SETTLEMENT'; data: Settlement }) => void;
}

export function TransactionList({
  expenses,
  settlements,
  currentUserEmail,
  currency,
  members = [],
  simplifiedDebts = [],
  onOpenAddExpense,
  onSettleDebt,
  onEditExpense,
  onEditSettlement,
  onViewHistory,
}: TransactionListProps) {
  const [filter, setFilter] = useState<'all' | 'expenses' | 'settlements'>('all');

  type UnifiedItem =
    | { type: 'EXPENSE'; date: string; data: Expense }
    | { type: 'SETTLEMENT'; date: string; data: Settlement };

  const items: UnifiedItem[] = [];

  if (filter === 'all' || filter === 'expenses') {
    for (const e of expenses) {
      if (e.status !== 'DELETED') {
        items.push({ type: 'EXPENSE', date: e.date, data: e });
      }
    }
  }

  if (filter === 'all' || filter === 'settlements') {
    for (const s of settlements) {
      if (s.status !== 'DELETED') {
        items.push({ type: 'SETTLEMENT', date: s.date, data: s });
      }
    }
  }

  // Sort descending by date, then by created time
  items.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      {/* Active Settlements Widget for this group */}
      {simplifiedDebts && simplifiedDebts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <HandCoins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Active Settlements ({simplifiedDebts.length})
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Payments required to settle all debts in this group.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {simplifiedDebts.map((debt, idx) => {
              const isPayer = debt.fromEmail === currentUserEmail;
              const isPayee = debt.toEmail === currentUserEmail;
              const isMyDebt = isPayer || isPayee;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                    isMyDebt
                      ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                      : 'border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                      <UserAvatar
                        name={debt.fromName}
                        picture={members.find((m) => m.email.toLowerCase() === debt.fromEmail.toLowerCase())?.picture}
                        size="xs"
                      />
                      <span>{isPayer ? 'You' : debt.fromName}</span>
                    </div>
                    <span className="text-slate-400 dark:text-slate-500">owes</span>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                      <UserAvatar
                        name={debt.toName}
                        picture={members.find((m) => m.email.toLowerCase() === debt.toEmail.toLowerCase())?.picture}
                        size="xs"
                      />
                      <span>{isPayee ? 'You' : debt.toName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span
                      className={`text-sm font-extrabold ${
                        isPayee
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isPayer
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {formatCurrency(debt.amount, debt.currency || currency)}
                    </span>
                    {onSettleDebt && (
                      <Button
                        size="sm"
                        variant={isMyDebt ? 'primary' : 'outline'}
                        onClick={() => onSettleDebt(debt)}
                        className="py-1 px-3 text-xs gap-1 shadow-xs"
                      >
                        <HandCoins className="w-3.5 h-3.5" />
                        <span>Settle</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feed Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({expenses.length + settlements.length})
          </button>
          <button
            onClick={() => setFilter('expenses')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'expenses'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setFilter('settlements')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'settlements'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Settlements ({settlements.length})
          </button>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No transactions recorded</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
              Add an expense to start splitting bills with group members.
            </p>
          </div>
          <Button size="sm" onClick={onOpenAddExpense} className="gap-1.5 mx-auto">
            <Plus className="w-4 h-4" />
            <span>Add First Expense</span>
          </Button>
        </div>
      )}

      {/* Transaction Feed */}
      {items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((item) => (
            <TransactionItem
              key={item.data.id}
              item={item}
              currentUserEmail={currentUserEmail}
              currency={currency}
              members={members}
              onEdit={(unifiedItem) => {
                if (unifiedItem.type === 'EXPENSE') {
                  onEditExpense?.(unifiedItem.data);
                } else {
                  onEditSettlement?.(unifiedItem.data);
                }
              }}
              onViewHistory={onViewHistory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
