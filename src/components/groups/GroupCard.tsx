import { Table, ChevronRight, UserCheck, Shield } from 'lucide-react';
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
      className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer group flex items-center justify-between"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Table className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
            {cleanTitle}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isOwner ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-medium text-[11px]">
                <Shield className="w-3 h-3" /> Owner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                <UserCheck className="w-3 h-3" /> Shared with you
              </span>
            )}
            <span>•</span>
            <span className="truncate">Google Sheet</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {balanceInfo && (
          <div className="text-right">
            {balanceInfo.netBalance > 0.005 ? (
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                  You are owed
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(balanceInfo.netBalance, balanceInfo.currency)}
                </span>
              </div>
            ) : balanceInfo.netBalance < -0.005 ? (
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-500 dark:text-rose-400 tracking-wider block">
                  You owe
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400">
                  -{formatCurrency(Math.abs(balanceInfo.netBalance), balanceInfo.currency)}
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                Settled up
              </span>
            )}
          </div>
        )}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
