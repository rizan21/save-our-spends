import { useMemo } from 'react';
import type { GroupFinancialSummary } from '../../../types/balance';
import type { Member } from '../../../types/group';
import { formatCurrency } from '../../../core/splitCalculator';
import { UserAvatar } from '../../../components/common/UserAvatar';

export interface BalancesSummaryProps {
  summary: GroupFinancialSummary | null;
  currentUserEmail: string;
  currentUserPicture?: string;
  members?: Member[];
  currency?: string;
  isModalOpen?: boolean;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
}

export function BalancesSummary({
  summary,
  currentUserEmail,
  currentUserPicture,
  members = [],
  currency: propCurrency,
}: BalancesSummaryProps) {
  const currency = propCurrency || summary?.currency || 'USD';
  const memberMap = useMemo(
    () => new Map<string, Member>(members.map((m) => [m.email.toLowerCase(), m])),
    [members]
  );

  const myEmail = currentUserEmail.toLowerCase();
  const balancesList = useMemo(
    () => (summary ? Object.values(summary.balances) : []),
    [summary]
  );

  const myBalance = useMemo(() => {
    if (!summary) return null;
    return (
      summary.balances[currentUserEmail] ||
      balancesList.find((b) => b.email.toLowerCase() === myEmail) || {
        email: currentUserEmail,
        name: 'You',
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      }
    );
  }, [summary, currentUserEmail, balancesList, myEmail]);

  const orderedBalances = useMemo(() => {
    if (!myBalance) return balancesList;
    const others = balancesList.filter((b) => b.email.toLowerCase() !== myEmail);
    return [myBalance, ...others];
  }, [balancesList, myBalance, myEmail]);

  if (!summary || !myBalance) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
          Member Balances
        </h3>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {orderedBalances.map((b) => {
          const isCurrentUser = b.email.toLowerCase() === myEmail;
          const memberPic = isCurrentUser
            ? currentUserPicture || memberMap.get(b.email.toLowerCase())?.picture
            : memberMap.get(b.email.toLowerCase())?.picture;
          const isPositive = b.netBalance > 0.005;
          const isNegative = b.netBalance < -0.005;

          return (
            <div
              key={b.email}
              className="py-2.5 flex items-center justify-between text-xs sm:text-sm first:pt-1 last:pb-1"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <UserAvatar name={b.name} picture={memberPic} size="sm" />
                <div className="min-w-0 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="truncate">{b.name}</span>
                  {isCurrentUser && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                      (You)
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                {isPositive ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{formatCurrency(b.netBalance, currency)}
                  </span>
                ) : isNegative ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    -{formatCurrency(Math.abs(b.netBalance), currency)}
                  </span>
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
