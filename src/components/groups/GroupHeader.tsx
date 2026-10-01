import { useRef, useEffect } from 'react';
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
  Bell,
  BellOff,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import type { Group } from '../../types/group';
import type { GroupFinancialSummary } from '../../types/balance';
import { GROUP_TABS, type GroupTab } from '../../hooks/useSwipeableTabs';

export { GROUP_TABS, type GroupTab };

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
  isPushEnabled?: boolean;
  onToggleNotifications?: () => void;
  onOpenNotificationSettings?: () => void;
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
  isPushEnabled = false,
  onToggleNotifications,
  onOpenNotificationSettings,
}: GroupHeaderProps) {
  const isOwner = group.ownerEmail === currentUserEmail;
  const currency = financialSummary?.currency || group.currency || 'USD';
  const pendingApprovalsCount = isOwner
    ? group.pendingInvites.filter((i) => i.status === 'PENDING').length
    : 0;

  const tabRefs = useRef<Record<GroupTab, HTMLButtonElement | null>>({
    overview: null,
    expenses: null,
    balances: null,
    members: null,
  });

  // Auto-scroll the active tab into center view in the horizontal tabs bar on mobile
  useEffect(() => {
    const activeEl = tabRefs.current[activeTab];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = GROUP_TABS.indexOf(activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % GROUP_TABS.length;
      const nextTab = GROUP_TABS[nextIndex];
      onTabChange(nextTab);
      tabRefs.current[nextTab]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + GROUP_TABS.length) % GROUP_TABS.length;
      const prevTab = GROUP_TABS[prevIndex];
      onTabChange(prevTab);
      tabRefs.current[prevTab]?.focus();
    }
  };

  const tabsConfig: {
    id: GroupTab;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: React.ReactNode;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'balances', label: 'Balances & Settle', icon: Scale },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      badge: pendingApprovalsCount > 0 ? (
        <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-0.5">
          <ShieldAlert className="w-2.5 h-2.5" /> {pendingApprovalsCount}
        </span>
      ) : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-700 transition-all cursor-pointer shrink-0"
            title="Back to all groups"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight break-words">
                {group.name}
              </h1>
              <Badge variant={isOwner ? 'emerald' : 'slate'} className="shrink-0">
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
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
          <Button size="sm" onClick={onOpenAddExpense} className="gap-1 flex-1 sm:flex-initial shrink-0 min-h-[38px] sm:min-h-[34px] shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenSettleUp} className="gap-1 shrink-0 min-h-[38px] sm:min-h-[34px]">
            <HandCoins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Settle Up</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenInvite} className="gap-1 shrink-0 min-h-[38px] sm:min-h-[34px]">
            <UserPlus className="w-4 h-4" />
            <span>Invite</span>
          </Button>
          {group.driveFileUrl && (
            <a
              href={group.driveFileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl transition-all shadow-xs shrink-0 min-h-[38px] sm:min-h-[34px]"
              title="Open raw Google Sheet in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Sheet</span>
            </a>
          )}
          {(onOpenNotificationSettings || onToggleNotifications) && (
            <button
              type="button"
              onClick={onOpenNotificationSettings || onToggleNotifications}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-all shadow-xs shrink-0 min-h-[38px] sm:min-h-[34px] cursor-pointer border ${
                isPushEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={isPushEnabled ? 'Push notifications active — click to test or configure' : 'Enable push notifications and real-time sync'}
            >
              {isPushEnabled ? (
                <>
                  <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                  <span>Notify</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5" />
                  <span>Notify</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>



      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Group tabs"
        onKeyDown={handleTabKeyDown}
        className="flex border-b border-slate-200 dark:border-slate-800 gap-3 sm:gap-6 text-sm font-medium overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {tabsConfig.map(({ id, label, icon: Icon, badge }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el;
              }}
              role="tab"
              id={`tab-${id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(id)}
              className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {badge}
            </button>
          );
        })}
      </div>
    </div>
  );
}
