import { useState, useMemo } from 'react';
import type { GroupFinancialSummary } from '../../types/balance';
import type { Member } from '../../types/group';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../core/splitCalculator';
import { UserAvatar } from '../common/UserAvatar';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

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
  isModalOpen: controlledModalOpen,
  onOpenModal,
  onCloseModal,
}: BalancesSummaryProps) {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isOpen = controlledModalOpen !== undefined ? controlledModalOpen : internalModalOpen;

  const handleOpen = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  const handleClose = () => {
    if (onCloseModal) {
      onCloseModal();
    } else {
      setInternalModalOpen(false);
    }
  };

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
    <>
      {/* Clickable Member Balances Div */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 rounded-2xl p-5 shadow-xs space-y-3 cursor-pointer group transition-all"
        aria-label="Open member balances popup"
      >
        {/* Header with Title and Arrow at the right end */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Member Balances
          </h3>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* Current user's balance row (clean without paid/share values) */}
        <div className="py-1 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar
              name={myBalance.name}
              picture={currentUserPicture || memberMap.get(myBalance.email.toLowerCase())?.picture}
              size="sm"
            />
            <div className="min-w-0 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="truncate">{myBalance.name}</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                (You)
              </span>
            </div>
          </div>

          <div className="text-right shrink-0 ml-2">
            {myBalance.netBalance > 0.005 ? (
              <div>
                <div className="flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{formatCurrency(myBalance.netBalance, currency)}</span>
                </div>
                <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                  You get back
                </div>
              </div>
            ) : myBalance.netBalance < -0.005 ? (
              <div>
                <div className="flex items-center justify-end gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>-{formatCurrency(Math.abs(myBalance.netBalance), currency)}</span>
                </div>
                <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium">
                  You owe
                </div>
              </div>
            ) : (
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Settled</span>
                <div className="text-[10px] text-slate-400 font-medium">All settled up</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup Modal showing all users' balances */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Member Balances"
        maxWidth="md"
        showCloseButton={false}
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden px-3 bg-white dark:bg-slate-900">
            {orderedBalances.map((b) => {
              const isCurrentUser = b.email.toLowerCase() === myEmail;
              const memberPic = isCurrentUser
                ? (currentUserPicture || memberMap.get(b.email.toLowerCase())?.picture)
                : memberMap.get(b.email.toLowerCase())?.picture;
              const isPositive = b.netBalance > 0.005;
              const isNegative = b.netBalance < -0.005;

              return (
                <div
                  key={b.email}
                  className="py-3 flex items-center justify-between text-xs sm:text-sm"
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
                      <div>
                        <div className="flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>+{formatCurrency(b.netBalance, currency)}</span>
                        </div>
                        <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                          {isCurrentUser ? 'You get back' : 'Gets back'}
                        </div>
                      </div>
                    ) : isNegative ? (
                      <div>
                        <div className="flex items-center justify-end gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>-{formatCurrency(Math.abs(b.netBalance), currency)}</span>
                        </div>
                        <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium">
                          {isCurrentUser ? 'You owe' : 'Owes'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Settled</span>
                        {isCurrentUser && (
                          <div className="text-[10px] text-slate-400 font-medium">All settled up</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Done Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
