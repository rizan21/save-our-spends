import { ChevronRight } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import type { GoogleDriveFile } from '../../types/google';
import { formatCurrency } from '../../core/splitCalculator';

export interface GroupCardProps {
  file: GoogleDriveFile;
  currentUserEmail: string;
  balanceInfo?: { netBalance: number; currency: string };
  onClick: () => void;
}

export function GroupCard({ file, currentUserEmail, balanceInfo, onClick }: GroupCardProps) {
  // Strip '[SpreadSpends]' prefix if present for clean title
  const cleanTitle = file.name.replace(/^\[SpreadSpends\]\s*/, '');
  const isOwner = file.owners?.some((o) => o.emailAddress === currentUserEmail);

  return (
    <div
      onClick={onClick}
      className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer group flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
          {cleanTitle}
        </h3>
        {isOwner && <Badge variant="emerald">Owner</Badge>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {balanceInfo && (
          <div className="text-right">
            {balanceInfo.netBalance > 0.005 ? (
              <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(balanceInfo.netBalance, balanceInfo.currency)}
              </span>
            ) : balanceInfo.netBalance < -0.005 ? (
              <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400">
                -{formatCurrency(Math.abs(balanceInfo.netBalance), balanceInfo.currency)}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                Settled up
              </span>
            )}
          </div>
        )}
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
