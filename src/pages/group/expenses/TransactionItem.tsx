import { CategoryIcon } from '../../../components/common/CategoryIcon';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { HandCoins } from 'lucide-react';
import type { Expense, Settlement } from '../../../types/transaction';
import type { Member } from '../../../types/group';
import { formatCurrency } from '../../../core/splitCalculator';
import { formatTransactionDateTime } from '../../../core/dateTime';

export type UnifiedTransactionItem =
  | { type: 'EXPENSE'; data: Expense }
  | { type: 'SETTLEMENT'; data: Settlement };

export interface TransactionItemProps {
  item: UnifiedTransactionItem;
  currentUserEmail: string;
  currency: string;
  members?: Member[];
  onEdit?: (item: UnifiedTransactionItem) => void;
  onDelete?: (item: UnifiedTransactionItem) => void;
  onViewHistory?: (item: UnifiedTransactionItem) => void;
}

export function TransactionItem({
  item,
  currentUserEmail,
  currency,
  members = [],
  onViewHistory,
}: TransactionItemProps) {
  if (item.type === 'SETTLEMENT') {
    const s = item.data;
    const isPayer = s.payerEmail === currentUserEmail;
    const isPayee = s.payeeEmail === currentUserEmail;
    const payerMember = members.find((m) => m.email.toLowerCase() === s.payerEmail.toLowerCase());
    const payeeMember = members.find((m) => m.email.toLowerCase() === s.payeeEmail.toLowerCase());

    const handleCardClick = () => {
      onViewHistory?.(item);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onViewHistory?.(item);
      }
    };

    const dt = formatTransactionDateTime(s.date, s.createdAt);

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        aria-label={`Settlement: ${isPayer ? 'You' : s.payerName} paid ${isPayee ? 'You' : s.payeeName} ${formatCurrency(s.amount, currency)}. Click to view history and details.`}
        className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all gap-3 text-left"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40 flex items-center justify-center shrink-0">
            <HandCoins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate flex items-center gap-1.5">
              <UserAvatar name={s.payerName} picture={payerMember?.picture} size="xs" />
              <span className="text-slate-400 dark:text-slate-500 font-normal">paid</span>
              <UserAvatar name={s.payeeName} picture={payeeMember?.picture} size="xs" />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {dt.date}
                {s.paymentMethod ? ` • ${s.paymentMethod}` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {formatCurrency(s.amount, currency)}
          </div>
        </div>
      </div>
    );
  }

  // EXPENSE
  const exp = item.data;
  const userPaid = exp.paidBy[currentUserEmail] || 0;
  const userOwed = exp.splits[currentUserEmail] || 0;
  const userNet = userPaid - userOwed;
  const isInvolved = userPaid > 0.005 || userOwed > 0.005;
  const isPositive = userNet > 0.005;

  const handleCardClick = () => {
    onViewHistory?.(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onViewHistory?.(item);
    }
  };

  const dt = formatTransactionDateTime(exp.date, exp.createdAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      aria-label={`Expense: ${exp.description}, ${formatCurrency(exp.amount, currency)}. Click to view history and details.`}
      className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all gap-3 text-left"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <CategoryIcon category={exp.category} size="md" />
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">
            {exp.description}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{dt.date}</span>
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        {isInvolved ? (
          <>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(exp.amount, currency)}
            </div>
            <div className="text-[11px] font-medium">
              {Math.abs(userNet) > 0.005 ? (
                <span
                  className={
                    isPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  {isPositive ? '+' : '-'}
                  {formatCurrency(Math.abs(userNet), currency)}
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">Settled</span>
              )}
            </div>
          </>
        ) : (
          <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
            You are not involved
          </div>
        )}
      </div>
    </div>
  );
}
