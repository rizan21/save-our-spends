import { useState } from 'react';
import { Plus, Search, FolderPlus, RefreshCw, FolderDown, TrendingUp, TrendingDown, Table, LogIn, Bell, BellOff } from 'lucide-react';
import { GroupCard } from '../../pages/groups/GroupCard';
import { Button } from '../common/Button';
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
  isPushEnabled?: boolean;
  onOpenNotifications?: () => void;
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
  totalYouAreOwed = 0,
  totalYouOwe = 0,
  currency = 'USD',
  isPushEnabled = false,
  onOpenNotifications,
  onSelectGroup,
  onOpenCreateGroup,
  onOpenImportModal,
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Table className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Split expenses with Google Sheets
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Every expense group is stored securely on your own Google Drive as a structured spreadsheet. No third-party database, 100% private and transparent.
            </p>
          </div>
          <div className="pt-2">
            <Button size="lg" onClick={onLogin} className="gap-2.5 mx-auto px-6 shadow-md">
              <LogIn className="w-5 h-5" />
              <span>Sign in with Google</span>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <strong className="block text-slate-800 dark:text-slate-200 font-semibold">100% Private</strong>
              <span>Stored on your Drive</span>
            </div>
            <div>
              <strong className="block text-slate-800 dark:text-slate-200 font-semibold">Real Sheets</strong>
              <span>Formulas & CSV Export</span>
            </div>
            <div>
              <strong className="block text-slate-800 dark:text-slate-200 font-semibold">Smart Settle</strong>
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
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
          Your Groups
        </h2>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefetching}
            className="p-2"
            title="Refresh groups"
            aria-label="Refresh groups"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          {onOpenNotifications && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenNotifications}
              className="p-2"
              title="Notifications & Sync"
              aria-label="Notifications & Sync"
            >
              {isPushEnabled ? (
                <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
              ) : (
                <BellOff className="w-4 h-4 text-slate-400" />
              )}
            </Button>
          )}
          {onOpenImportModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenImportModal}
              className="p-2"
              title="Open shared group"
              aria-label="Open shared group"
            >
              <FolderDown className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" onClick={onOpenCreateGroup} className="gap-1 shadow-sm px-3">
            <Plus className="w-4 h-4" />
            <span>New</span>
          </Button>
        </div>
      </div>

      {/* Overall Financial Balance Overview */}
      {(totalYouAreOwed > 0 || totalYouOwe > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/80 rounded-2xl shadow-xs flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                Total Owed
              </span>
              <span className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate block">
                +{formatCurrency(totalYouAreOwed, currency)}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/80 rounded-2xl shadow-xs flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                Total Owe
              </span>
              <span className="text-base sm:text-xl font-extrabold text-rose-600 dark:text-rose-400 truncate block">
                -{formatCurrency(totalYouOwe, currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {groups.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="space-y-2">
                  <div className="w-40 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-24 h-3 bg-slate-100 dark:bg-slate-850 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <FolderPlus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No groups found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
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
