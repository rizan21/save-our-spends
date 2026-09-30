import { CategoryIcon } from '../common/CategoryIcon';
import { UserAvatar } from '../common/UserAvatar';
import { HandCoins, Pencil, History } from 'lucide-react';
import type { Expense, Settlement } from '../../types/transaction';
import type { Member } from '../../types/group';
import { formatCurrency } from '../../core/splitCalculator';
import { formatTransactionDateTime } from '../../core/dateTime';

export type UnifiedTransactionItem =
  | { type: 'EXPENSE'; data: Expense }
  | { type: 'SETTLEMENT'; data: Settlement };

export interface TransactionItemProps {
  item: UnifiedTransactionItem;
  currentUserEmail: string;
  currency: string;
  members?: Member[];
  onEdit?: (item: UnifiedTransactionItem) => void;
  onViewHistory?: (item: UnifiedTransactionItem) => void;
}

export function TransactionItem({
  item,
  currentUserEmail,
  currency,
  members = [],
  onEdit,
  onViewHistory,
}: TransactionItemProps) {

  if (item.type === 'SETTLEMENT') {
    const s = item.data;
    const isPayer = s.payerEmail === currentUserEmail;
    const isPayee = s.payeeEmail === currentUserEmail;
    const payerMember = members.find((m) => m.email.toLowerCase() === s.payerEmail.toLowerCase());
    const payeeMember = members.find((m) => m.email.toLowerCase() === s.payeeEmail.toLowerCase());
    const hasHistory = !!(s.history && s.history.length > 0);

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
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <UserAvatar name={s.payerName} picture={payerMember?.picture} size="xs" />
                <span>{isPayer ? 'You' : s.payerName}</span>
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-normal">paid</span>
              <span className="inline-flex items-center gap-1">
                <UserAvatar name={s.payeeName} picture={payeeMember?.picture} size="xs" />
                <span>{isPayee ? 'You' : s.payeeName}</span>
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{dt.date}</span>
              <span className="text-slate-400 dark:text-slate-500 font-normal">{dt.time}</span>
              <span>•</span>
              <span className="text-teal-700 dark:text-teal-300 font-medium">{s.paymentMethod}</span>
              {s.notes && <span>• {s.notes}</span>}
              {hasHistory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHistory?.(item);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-850 px-1.5 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs"
                  title="View edit history"
                >
                  <History className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Edited ({s.history!.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(s.amount, currency)}
            </div>
            <div className="text-[11px] font-medium">
              {isPayer && <span className="text-slate-500 dark:text-slate-400">You paid</span>}
              {isPayee && <span className="text-emerald-600 dark:text-emerald-400">You received</span>}
              {!isPayer && !isPayee && <span className="text-slate-400 dark:text-slate-500">Settled</span>}
            </div>
          </div>

          {(onEdit || (onViewHistory && hasHistory)) && (
            <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-800 pl-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Edit settlement"
                  aria-label="Edit settlement"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onViewHistory && hasHistory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHistory(item);
                  }}
                  className="p-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                  title="View change history"
                  aria-label="View change history"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // EXPENSE
  const exp = item.data;
  const userPaid = exp.paidBy[currentUserEmail] || 0;
  const userOwed = exp.splits[currentUserEmail] || 0;
  const userNet = userPaid - userOwed;
  const hasHistory = !!(exp.history && exp.history.length > 0);

  // Single payer name or "multiple people"
  const payerEmails = Object.keys(exp.paidBy);
  const singlePayerEmail = payerEmails.length === 1 ? payerEmails[0] : null;
  const singlePayerMember = singlePayerEmail
    ? members.find((m) => m.email.toLowerCase() === singlePayerEmail.toLowerCase())
    : null;
  const primaryPayerName = singlePayerEmail
    ? singlePayerEmail === currentUserEmail
      ? 'You'
      : singlePayerMember?.name || singlePayerEmail.split('@')[0]
    : `${payerEmails.length} people`;

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
            <span className="text-slate-400 dark:text-slate-500 font-normal">{dt.time}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              {singlePayerMember && (
                <UserAvatar
                  name={singlePayerMember.name}
                  picture={singlePayerMember.picture}
                  size="xs"
                />
              )}
              <span>{primaryPayerName} paid</span>
            </span>
            {exp.notes && <span>• {exp.notes}</span>}
            {hasHistory && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory?.(item);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-850 px-1.5 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs"
                title="View edit history"
              >
                <History className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Edited ({exp.history!.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {formatCurrency(exp.amount, currency)}
          </div>
          <div className="text-[11px] font-medium">
            {userNet > 0.005 ? (
              <span className="text-emerald-600 dark:text-emerald-400">You lent +{formatCurrency(userNet, currency)}</span>
            ) : userNet < -0.005 ? (
              <span className="text-rose-600 dark:text-rose-400">You owe {formatCurrency(Math.abs(userNet), currency)}</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">Not involved</span>
            )}
          </div>
        </div>

        {(onEdit || (onViewHistory && hasHistory)) && (
          <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-800 pl-2">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Edit expense"
                aria-label="Edit expense"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onViewHistory && hasHistory && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory(item);
                }}
                className="p-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                title="View change history"
                aria-label="View change history"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
