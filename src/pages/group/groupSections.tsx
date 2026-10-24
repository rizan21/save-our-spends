import React from 'react';
import { LayoutDashboard, Receipt, Scale, Settings, type LucideIcon } from 'lucide-react';
import type { GroupTab } from '../../hooks/useSwipeableTabs';
import { SummarySection } from './summary/SummarySection';
import { ExpensesSection } from './expenses/ExpensesSection';
import { BalancesSection } from './balances/BalancesSection';
import { SettlementSection } from './settlement/SettlementSection';
import { MembersSection } from './members/MembersSection';
import type { GroupContextValue } from './GroupContext';

export interface GroupSectionConfig {
  id: GroupTab;
  label: string;
  icon: LucideIcon;
  render: () => React.ReactNode;
  getBadge?: (context: GroupContextValue) => React.ReactNode;
}

export const GROUP_SECTIONS: GroupSectionConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    render: () => <SummarySection />,
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    render: () => <ExpensesSection />,
  },
  {
    id: 'balances',
    label: 'Balances',
    icon: Scale,
    render: () => (
      <div className="space-y-6">
        <BalancesSection />
        <SettlementSection />
      </div>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    render: () => <MembersSection />,
    getBadge: (context) => {
      const pendingCount = context.isOwner
        ? context.group.pendingInvites.filter((i) => i.status === 'PENDING').length
        : 0;
      return pendingCount > 0 ? (
        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
          {pendingCount}
        </span>
      ) : null;
    },
  },
];
