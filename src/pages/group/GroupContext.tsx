import React, { createContext, useContext } from 'react';
import type { Group, PendingInvite } from '../../types/group';
import type { Expense, Settlement } from '../../types/transaction';
import type { GroupFinancialSummary, SimplifiedDebt } from '../../types/balance';
import type { GoogleUser } from '../../types/google';
import type { GroupTab } from '../../hooks/useSwipeableTabs';

export interface GroupContextValue {
  group: Group;
  expenses: Expense[];
  settlements: Settlement[];
  financialSummary: GroupFinancialSummary | null;
  currentUser: GoogleUser | null;
  isOwner: boolean;
  currency: string;
  onNavigateToTab: (tab: GroupTab) => void;
  // Mutations
  addExpense: (expense: Expense) => Promise<unknown>;
  updateExpense: (expense: Expense) => Promise<unknown>;
  deleteExpense: (params: { expenseId: string; editorEmail?: string }) => Promise<unknown>;
  addSettlement: (settlement: Settlement) => Promise<unknown>;
  updateSettlement: (settlement: Settlement) => Promise<unknown>;
  deleteSettlement: (params: { settlementId: string; editorEmail?: string }) => Promise<unknown>;
  proposeInvite: (invite: PendingInvite) => Promise<unknown>;
  approveInvite: (params: { inviteId: string; approverEmail: string }) => Promise<unknown>;
  isApprovingInvite: boolean;
  updateDescription: (description: string) => Promise<unknown>;
  isUpdatingDescription: boolean;
  updateMemberName: (params: { email: string; newName: string }) => Promise<unknown>;
  softDeleteMember: (memberEmail: string) => Promise<unknown>;
  isSoftDeletingMember: boolean;
  restoreMember: (memberEmail: string) => Promise<unknown>;
  isRestoringMember: boolean;
  // Action triggers
  openAddExpense: () => void;
  openSettleUp: (debt?: SimplifiedDebt | null) => void;
  openInviteModal: (initialEmail?: string) => void;
  openEditProfile?: () => void;
  viewTransactionHistory: (item: { type: 'EXPENSE'; data: Expense } | { type: 'SETTLEMENT'; data: Settlement }) => void;
  openEditExpense: (expense: Expense) => void;
  openEditSettlement: (settlement: Settlement) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export interface GroupProviderProps {
  value: GroupContextValue;
  children: React.ReactNode;
}

export function GroupProvider({ value, children }: GroupProviderProps) {
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function useGroupContext(): GroupContextValue | null {
  return useContext(GroupContext);
}
