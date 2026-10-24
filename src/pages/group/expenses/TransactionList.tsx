import { useState } from 'react';
import { TransactionItem } from './TransactionItem';
import { Button } from '../../../components/common/Button';
import { Receipt, Plus } from 'lucide-react';
import type { Expense, Settlement } from '../../../types/transaction';
import type { SimplifiedDebt } from '../../../types/balance';
import type { Member } from '../../../types/group';

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
  onDeleteExpense?: (expense: Expense) => void;
  onEditSettlement?: (settlement: Settlement) => void;
  onDeleteSettlement?: (settlement: Settlement) => void;
  onViewHistory?: (item: { type: 'EXPENSE'; data: Expense } | { type: 'SETTLEMENT'; data: Settlement }) => void;
}

export function TransactionList({
  expenses,
  settlements,
  currentUserEmail,
  currency,
  members = [],
  simplifiedDebts: _simplifiedDebts = [],
  onOpenAddExpense,
  onSettleDebt: _onSettleDebt,
  onEditExpense,
  onDeleteExpense,
  onEditSettlement,
  onDeleteSettlement,
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

  const activeExpensesCount = expenses.filter((e) => e.status !== 'DELETED').length;
  const activeSettlementsCount = settlements.filter((s) => s.status !== 'DELETED').length;

  // Sort descending by date, then by created time
  items.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
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
            All ({activeExpensesCount + activeSettlementsCount})
          </button>
          <button
            onClick={() => setFilter('expenses')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'expenses'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Expenses ({activeExpensesCount})
          </button>
          <button
            onClick={() => setFilter('settlements')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'settlements'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Settlements ({activeSettlementsCount})
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
              onDelete={(unifiedItem) => {
                if (unifiedItem.type === 'EXPENSE') {
                  onDeleteExpense?.(unifiedItem.data);
                } else {
                  onDeleteSettlement?.(unifiedItem.data);
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
