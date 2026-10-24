import { useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  HandCoins,
  Receipt,
  Scale,
  Settings,
  ShieldAlert,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '../common/Button';
import type { Group } from '../../types/group';
import type { GroupFinancialSummary } from '../../types/balance';
import { GROUP_TABS, type GroupTab } from '../../hooks/useSwipeableTabs';

export { GROUP_TABS, type GroupTab };

export interface GroupHeaderProps {
  group: Group;
  currentUserEmail: string;
  financialSummary?: GroupFinancialSummary | null;
  activeTab: GroupTab;
  onTabChange: (tab: GroupTab) => void;
  onBack: () => void;
  onOpenAddExpense: () => void;
  onOpenSettleUp: () => void;
  onOpenInvite?: () => void;
}

export function GroupHeader({
  group,
  currentUserEmail,
  activeTab,
  onTabChange,
  onBack,
  onOpenAddExpense,
  onOpenSettleUp,
}: GroupHeaderProps) {
  const isOwner = group.ownerEmail === currentUserEmail;
  const pendingApprovalsCount = isOwner
    ? group.pendingInvites.filter((i) => i.status === 'PENDING').length
    : 0;

  const tabRefs = useRef<Record<GroupTab, HTMLButtonElement | null>>({
    overview: null,
    expenses: null,
    balances: null,
    settings: null,
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
    { id: 'balances', label: 'Balances', icon: Scale },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
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
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-700 transition-all cursor-pointer shrink-0"
            title="Back to all groups"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {group.name}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button size="sm" onClick={onOpenAddExpense} className="gap-1 flex-1 sm:flex-initial shrink-0 min-h-[38px] sm:min-h-[34px] shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenSettleUp} className="gap-1 flex-1 sm:flex-initial shrink-0 min-h-[38px] sm:min-h-[34px]">
            <HandCoins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Settle Up</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Group tabs"
        onKeyDown={handleTabKeyDown}
        className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium"
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
              className={`pb-3 flex items-center justify-center gap-1 border-b-2 transition-all cursor-pointer whitespace-nowrap min-w-0 ${
                isActive
                  ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
              {badge}
            </button>
          );
        })}
      </div>
    </div>
  );
}
