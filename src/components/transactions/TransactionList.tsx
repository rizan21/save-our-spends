import { useState } from 'react';
import { TransactionItem } from './TransactionItem';
import { Button } from '../common/Button';
import { Receipt, Plus, HandCoins } from 'lucide-react';
import type { Expense, Settlement } from '../../types/transaction';
import type { SimplifiedDebt } from '../../types/balance';
import { formatCurrency } from '../../core/splitCalculator';

export interface TransactionListProps {
  expenses: Expense[];
  settlements: Settlement[];
  currentUserEmail: string;
  currency: string;
  simplifiedDebts?: SimplifiedDebt[];
  onOpenAddExpense: () => void;
  onSettleDebt?: (debt: SimplifiedDebt) => void;
}

export function TransactionList({
  expenses,
  settlements,
  currentUserEmail,
  currency,
  simplifiedDebts = [],
  onOpenAddExpense,
  onSettleDebt,
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
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HandCoins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Active Settlements ({simplifiedDebts.length})
                </h4>
                <p className="text-[11px] text-slate-500">
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
                      ? 'border-emerald-200 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200/70 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900">
                      {isPayer ? 'You' : debt.fromName}
                    </span>
                    <span className="text-slate-400">owes</span>
                    <span className="font-bold text-slate-900">
                      {isPayee ? 'You' : debt.toName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span
                      className={`text-sm font-extrabold ${
                        isPayee
                          ? 'text-emerald-600'
                          : isPayer
                          ? 'text-rose-600'
                          : 'text-slate-900'
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
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All ({expenses.length + settlements.length})
          </button>
          <button
            onClick={() => setFilter('expenses')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'expenses'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setFilter('settlements')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'settlements'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Settlements ({settlements.length})
          </button>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-3">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">No transactions recorded</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
