import {
  ArrowLeft,
  ExternalLink,
  Plus,
  HandCoins,
  UserPlus,
  Receipt,
  Scale,
  Users,
  ShieldAlert,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../core/splitCalculator';
import type { Group } from '../../types/group';
import type { GroupFinancialSummary } from '../../types/balance';

export type GroupTab = 'overview' | 'expenses' | 'balances' | 'members';

export interface GroupHeaderProps {
  group: Group;
  currentUserEmail: string;
  financialSummary: GroupFinancialSummary | null;
  activeTab: GroupTab;
  onTabChange: (tab: GroupTab) => void;
  onBack: () => void;
  onOpenAddExpense: () => void;
  onOpenSettleUp: () => void;
  onOpenInvite: () => void;
}

export function GroupHeader({
  group,
  currentUserEmail,
  financialSummary,
  activeTab,
  onTabChange,
  onBack,
  onOpenAddExpense,
  onOpenSettleUp,
  onOpenInvite,
}: GroupHeaderProps) {
  const isOwner = group.ownerEmail === currentUserEmail;
  const userBalance = financialSummary?.balances[currentUserEmail]?.netBalance || 0;
  const currency = financialSummary?.currency || group.currency || 'USD';
  const pendingApprovalsCount = isOwner
    ? group.pendingInvites.filter((i) => i.status === 'PENDING').length
    : 0;

  return (
    <div className="space-y-4">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-700 transition-all cursor-pointer"
            title="Back to all groups"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {group.name}
              </h1>
              <Badge variant={isOwner ? 'emerald' : 'slate'}>
                {isOwner ? 'You own this sheet' : 'Shared Group'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Currency: <span className="font-semibold text-slate-700 dark:text-slate-300">{currency}</span> •{' '}
              {group.members.length} members
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {group.driveFileUrl && (
            <a
              href={group.driveFileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl transition-all shadow-xs"
              title="Open raw Google Sheet in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Sheet</span>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={onOpenInvite} className="gap-1">
            <UserPlus className="w-4 h-4" />
            <span>Invite</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenSettleUp} className="gap-1">
            <HandCoins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Settle Up</span>
          </Button>
          <Button size="sm" onClick={onOpenAddExpense} className="gap-1">
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Financial Summary Highlight Card (shown on Expenses, Balances, and Members tabs) */}
      {activeTab !== 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Group Spending</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(financialSummary?.totalSpending || 0, currency)}
            </div>
          </div>
          <div className="sm:text-right">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Your Net Balance</span>
            <div className="mt-0.5">
              {userBalance > 0.005 ? (
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  You are owed {formatCurrency(userBalance, currency)}
                </span>
              ) : userBalance < -0.005 ? (
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  You owe {formatCurrency(Math.abs(userBalance), currency)}
                </span>
              ) : (
                <span className="text-xl font-bold text-slate-500 dark:text-slate-400">All settled up!</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-medium">
        <button
          onClick={() => onTabChange('overview')}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => onTabChange('expenses')}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expenses</span>
        </button>

        <button
          onClick={() => onTabChange('balances')}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'balances'
              ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Balances & Settle</span>
        </button>

        <button
          onClick={() => onTabChange('members')}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-0.5">
              <ShieldAlert className="w-2.5 h-2.5" /> {pendingApprovalsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
