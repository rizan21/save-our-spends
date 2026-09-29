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
      className="p-5 bg-white border border-slate-200/80 rounded-2xl hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-200 cursor-pointer group flex items-center justify-between"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Table className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
            {cleanTitle}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            {isOwner ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium text-[11px]">
                <Shield className="w-3 h-3" /> Owner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
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
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">
                  You are owed
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600">
                  +{formatCurrency(balanceInfo.netBalance, balanceInfo.currency)}
                </span>
              </div>
            ) : balanceInfo.netBalance < -0.005 ? (
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider block">
                  You owe
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-rose-600">
                  -{formatCurrency(Math.abs(balanceInfo.netBalance), balanceInfo.currency)}
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                Settled up
              </span>
            )}
          </div>
        )}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
