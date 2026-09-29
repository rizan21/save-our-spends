import { useState } from 'react';
import { Plus, Search, FolderPlus, RefreshCw, FolderDown, HandCoins, TrendingUp, TrendingDown } from 'lucide-react';
import { GroupCard } from './GroupCard';
import { Button } from '../common/Button';
import { Table, LogIn } from 'lucide-react';
import type { GoogleDriveFile } from '../../types/google';
import type { ActiveSettlementItem } from '../../hooks/useHomeSummary';
import type { SimplifiedDebt } from '../../types/balance';
import { formatCurrency } from '../../core/splitCalculator';

export interface GroupListProps {
  groups: GoogleDriveFile[];
  currentUserEmail: string;
  isLoading: boolean;
  isRefetching: boolean;
  groupBalances?: Record<string, { netBalance: number; currency: string }>;
  activeSettlements?: ActiveSettlementItem[];
  totalYouAreOwed?: number;
  totalYouOwe?: number;
  currency?: string;
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  onOpenImportModal?: () => void;
  onSettleDebt?: (groupId: string, debt: SimplifiedDebt) => void;
  onRefresh: () => void;
  onLogin: () => void;
}

export function GroupList({
  groups,
  currentUserEmail,
  isLoading,
  isRefetching,
  groupBalances,
  activeSettlements = [],
  totalYouAreOwed = 0,
  totalYouOwe = 0,
  currency = 'USD',
  onSelectGroup,
  onOpenCreateGroup,
  onOpenImportModal,
  onSettleDebt,
  onRefresh,
  onLogin,
}: GroupListProps) {
  const [search, setSearch] = useState('');

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!currentUserEmail) {
    return (
      <div className="py-8 sm:py-12">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Table className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Split expenses with Google Sheets
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Every expense group is stored securely on your own Google Drive as a structured spreadsheet. No third-party database, 100% private and transparent.
            </p>
          </div>
          <div className="pt-2">
            <Button size="lg" onClick={onLogin} className="gap-2.5 mx-auto px-6 shadow-md">
              <LogIn className="w-5 h-5" />
              <span>Sign in with Google</span>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-xs text-slate-600">
            <div>
              <strong className="block text-slate-800 font-semibold">100% Private</strong>
              <span>Stored on your Drive</span>
            </div>
            <div>
              <strong className="block text-slate-800 font-semibold">Real Sheets</strong>
              <span>Formulas & CSV Export</span>
            </div>
            <div>
              <strong className="block text-slate-800 font-semibold">Smart Settle</strong>
              <span>Minimal payments</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Groups</h2>
          <p className="text-xs text-slate-500 mt-1">
            Spreadsheets detected in your Google Drive or shared with your Google account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefetching}
            title="Scan Google Drive for new groups"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {onOpenImportModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenImportModal}
              className="gap-1.5"
              title="Open a shared group via Google Drive Picker or link"
            >
              <FolderDown className="w-4 h-4" />
              <span>Open Shared</span>
            </Button>
          )}
          <Button size="sm" onClick={onOpenCreateGroup} className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>New Group</span>
          </Button>
        </div>
      </div>

      {/* Overall Financial Balance Overview */}
      {(totalYouAreOwed > 0 || totalYouOwe > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total You Are Owed
              </span>
              <span className="text-xl font-extrabold text-emerald-600">
                +{formatCurrency(totalYouAreOwed, currency)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-white border border-rose-100 rounded-2xl shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total You Owe
              </span>
              <span className="text-xl font-extrabold text-rose-600">
                -{formatCurrency(totalYouOwe, currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Settlements Section */}
      {activeSettlements.length > 0 && (
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <HandCoins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Active Settlements</h3>
                <p className="text-xs text-slate-500">
                  Outstanding balances awaiting payment across your groups.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
              {activeSettlements.length} active
            </span>
          </div>

          <div className="space-y-2">
            {activeSettlements.map((item, idx) => {
              const isPayer = item.debt.fromEmail === currentUserEmail;
              const isPayee = item.debt.toEmail === currentUserEmail;

              return (
                <div
                  key={`${item.groupId}-${idx}`}
                  className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/20 hover:border-emerald-200 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isPayee ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <div className="text-xs truncate">
                      <span className="font-bold text-slate-900">
                        {isPayer ? 'You' : item.debt.fromName}
                      </span>{' '}
                      <span className="text-slate-400">owes</span>{' '}
                      <span className="font-bold text-slate-900">
                        {isPayee ? 'you' : item.debt.toName}
                      </span>
                      <span className="text-slate-300 mx-2">•</span>
                      <span className="text-slate-500 font-semibold">{item.groupName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span
                      className={`text-sm font-extrabold ${
                        isPayee ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(item.debt.amount, item.debt.currency)}
                    </span>
                    {onSettleDebt && (
                      <Button
                        size="sm"
                        onClick={() => onSettleDebt(item.groupId, item.debt)}
                        className="py-1 px-3 text-xs gap-1.5 shadow-xs"
                      >
                        <HandCoins className="w-3.5 h-3.5" />
                        <span>Settle</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Bar */}
      {groups.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs placeholder:text-slate-400"
          />
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 bg-white border border-slate-100 rounded-2xl animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="w-40 h-4 bg-slate-200 rounded" />
                  <div className="w-24 h-3 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <FolderPlus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">No groups found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {search
                ? `No groups matching "${search}".`
                : 'Create your first expense group. It will instantly generate a structured Google Sheet in your Google Drive.'}
            </p>
          </div>
          <Button onClick={onOpenCreateGroup} className="gap-1.5 mx-auto">
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </Button>
        </div>
      )}

      {/* Grid of Groups */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((file) => (
            <GroupCard
              key={file.id}
              file={file}
              currentUserEmail={currentUserEmail}
              balanceInfo={groupBalances?.[file.id]}
              onClick={() => onSelectGroup(file.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
