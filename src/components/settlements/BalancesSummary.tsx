import type { GroupFinancialSummary } from '../../types/balance';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../core/splitCalculator';

export interface BalancesSummaryProps {
  summary: GroupFinancialSummary | null;
  currentUserEmail: string;
  currency?: string;
}

export function BalancesSummary({ summary, currentUserEmail, currency: propCurrency }: BalancesSummaryProps) {
  if (!summary) return null;

  const currency = propCurrency || summary.currency || 'USD';
  const balancesList = Object.values(summary.balances);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-sm">Member Balances</h3>
        <span className="text-xs text-slate-500 font-medium">
          Total Spent: {formatCurrency(summary.totalSpending, currency)}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {balancesList.map((b) => {
          const isMe = b.email === currentUserEmail;
          return (
            <div key={b.email} className="py-3 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs">
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-slate-800 flex items-center gap-1.5">
                    {b.name} {isMe && <span className="text-[11px] text-emerald-600 font-semibold">(You)</span>}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Paid {formatCurrency(b.totalPaid, currency)} • Share {formatCurrency(b.totalOwed, currency)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                {b.netBalance > 0.005 ? (
                  <div className="flex items-center justify-end gap-1 text-emerald-600 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+{formatCurrency(b.netBalance, currency)}</span>
                  </div>
                ) : b.netBalance < -0.005 ? (
                  <div className="flex items-center justify-end gap-1 text-rose-600 font-semibold">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>-{formatCurrency(Math.abs(b.netBalance), currency)}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 font-medium">Settled</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
