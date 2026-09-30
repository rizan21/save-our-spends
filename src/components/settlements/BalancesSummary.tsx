import type { GroupFinancialSummary } from '../../types/balance';
import type { Member } from '../../types/group';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../core/splitCalculator';
import { UserAvatar } from '../common/UserAvatar';

export interface BalancesSummaryProps {
  summary: GroupFinancialSummary | null;
  currentUserEmail: string;
  currentUserPicture?: string;
  members?: Member[];
  currency?: string;
}

export function BalancesSummary({
  summary,
  currentUserEmail,
  currentUserPicture,
  members = [],
  currency: propCurrency,
}: BalancesSummaryProps) {
  if (!summary) return null;

  const currency = propCurrency || summary.currency || 'USD';
  const balancesList = Object.values(summary.balances);
  const memberMap = new Map<string, Member>(members.map((m) => [m.email, m]));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Member Balances</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Total Spent: {formatCurrency(summary.totalSpending, currency)}
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {balancesList.map((b) => {
          const isMe = b.email === currentUserEmail;
          const memberPic = isMe
            ? (currentUserPicture || memberMap.get(b.email)?.picture)
            : memberMap.get(b.email)?.picture;

          return (
            <div key={b.email} className="py-3 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <UserAvatar name={b.name} picture={memberPic} size="sm" />
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    {b.name} {isMe && <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">(You)</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Paid {formatCurrency(b.totalPaid, currency)} • Share {formatCurrency(b.totalOwed, currency)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                {b.netBalance > 0.005 ? (
                  <div className="flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+{formatCurrency(b.netBalance, currency)}</span>
                  </div>
                ) : b.netBalance < -0.005 ? (
                  <div className="flex items-center justify-end gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>-{formatCurrency(Math.abs(b.netBalance), currency)}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Settled</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
