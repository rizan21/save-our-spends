import type { Member } from '../../../types/group';
import type { Expense } from '../../../types/transaction';
import { formatCurrency } from '../../../core/splitCalculator';
import { ArrowLeftRight } from 'lucide-react';
import { UserAvatar } from '../../../components/common/UserAvatar';

export interface MemberSpendingsProps {
  members: Member[];
  expenses: Expense[];
  currentUserEmail: string;
  currentUserPicture?: string;
  currency?: string;
}

export function MemberSpendings({
  members,
  expenses,
  currentUserEmail,
  currentUserPicture,
  currency = 'USD',
}: MemberSpendingsProps) {
  const activeExpenses = expenses.filter((e) => e.status === 'ACTIVE');

  // Compute how much each member paid and consumed
  const spendings: Record<string, { paid: number; consumed: number }> = {};
  for (const m of members) spendings[m.email] = { paid: 0, consumed: 0 };

  for (const exp of activeExpenses) {
    for (const [p, amt] of Object.entries(exp.paidBy || {})) {
      if (spendings[p]) spendings[p].paid += amt;
    }
    for (const [c, amt] of Object.entries(exp.splits || {})) {
      if (spendings[c]) spendings[c].consumed += amt;
    }
  }

  const memberSpendings = members.map((m) => ({
    member: m,
    paid: spendings[m.email]?.paid || 0,
    consumed: spendings[m.email]?.consumed || 0,
  }));

  // Calculate highest amount among all paid and consumed to proportionally scale bars
  const maxAmount = Math.max(
    ...memberSpendings.map((s) => Math.max(s.paid, s.consumed)),
    1
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header with Title and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Spending & Consumption</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              How much each member paid out of pocket versus consumed in expenses.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium self-end sm:self-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">Consumed</span>
          </div>
        </div>
      </div>

      {/* Member Spendings List */}
      {activeExpenses.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
          No expenses recorded yet to show spending and consumption.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {memberSpendings.map(({ member, paid, consumed }) => {
            const isMe = member.email === currentUserEmail;
            const paidWidth = paid > 0 ? Math.max((paid / maxAmount) * 100, 2) : 0;
            const consumedWidth = consumed > 0 ? Math.max((consumed / maxAmount) * 100, 2) : 0;

            return (
              <div key={member.email} className="py-4 space-y-2.5 first:pt-1 last:pb-1">
                {/* Member Header */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={member.name}
                      picture={isMe ? (currentUserPicture || member.picture) : member.picture}
                      size="sm"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {member.name} {isMe && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">(You)</span>}
                    </span>
                  </div>
                </div>

                {/* Dual Visual Bars */}
                <div className="space-y-2 pl-9">
                  {/* Paid Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Paid</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(paid, currency)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${paidWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Consumed Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Consumed</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(consumed, currency)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${consumedWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
