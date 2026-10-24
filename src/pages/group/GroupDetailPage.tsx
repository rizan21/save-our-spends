import { useState, useMemo, useCallback } from 'react';
import { GroupHeader } from '../../components/groups/GroupHeader';
import { GroupTabsContainer } from '../../components/groups/GroupTabsContainer';
import { useGroupDetail } from '../../hooks/useGroupDetail';
import { useSwipeableTabs, type GroupTab } from '../../hooks/useSwipeableTabs';
import { GroupProvider, type GroupContextValue } from './GroupContext';
import { GROUP_SECTIONS } from './groupSections';
import { Button } from '../../components/common/Button';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { AlertCircle } from 'lucide-react';
import type { GoogleUser } from '../../types/google';
import type { Expense, Settlement } from '../../types/transaction';
import type { SimplifiedDebt } from '../../types/balance';
import { AddExpenseModal } from './expenses/AddExpenseModal';
import { SettleUpModal } from './settlement/SettleUpModal';
import { TransactionHistoryModal } from './expenses/TransactionHistoryModal';
import { InviteMemberModal } from './members/InviteMemberModal';

export interface GroupDetailPageProps {
  groupId: string;
  currentUser: GoogleUser | null;
  initialTab?: GroupTab;
  initialDebtToSettle?: SimplifiedDebt | null;
  onBack: () => void;
  onOpenEditProfile: () => void;
}

export function GroupDetailPage({
  groupId,
  currentUser,
  initialTab = 'overview',
  initialDebtToSettle = null,
  onBack,
  onOpenEditProfile,
}: GroupDetailPageProps) {
  // Group query & mutations
  const {
    group,
    expenses,
    settlements,
    financialSummary,
    isLoading: isGroupLoading,
    error: groupError,
    refetch: refetchGroup,
    addExpense,
    updateExpense,
    deleteExpense,
    addSettlement,
    updateSettlement,
    deleteSettlement,
    proposeInvite,
    approveInvite,
    isApprovingInvite,
    updateDescription,
    isUpdatingDescription,
    updateMemberName,
    softDeleteMember,
    isSoftDeletingMember,
    restoreMember,
    isRestoringMember,
  } = useGroupDetail(groupId);

  // Modal visibility states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(Boolean(initialDebtToSettle));
  const [selectedDebtToSettle, setSelectedDebtToSettle] = useState<SimplifiedDebt | null>(
    initialDebtToSettle
  );
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteInitialEmail, setInviteInitialEmail] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);
  const [viewingHistoryTransaction, setViewingHistoryTransaction] = useState<
    | { type: 'EXPENSE'; data: Expense }
    | { type: 'SETTLEMENT'; data: Settlement }
    | null
  >(null);

  const isAnyModalOpen = Boolean(
    isAddExpenseOpen ||
      isSettleUpOpen ||
      isInviteModalOpen ||
      selectedDebtToSettle ||
      editingExpense ||
      editingSettlement ||
      viewingHistoryTransaction
  );

  const {
    activeTab,
    slideDirection,
    dragOffset,
    isDragging,
    setTab,
    touchHandlers,
  } = useSwipeableTabs({
    initialTab,
    enabled: Boolean(groupId) && !isAnyModalOpen,
  });

  const isOwner = Boolean(group && currentUser && group.ownerEmail === currentUser.email);
  const currency = financialSummary?.currency || group?.currency || 'USD';

  // Derive live transaction for history modal from freshest expenses/settlements
  const currentViewingTransaction = useMemo(() => {
    if (!viewingHistoryTransaction) return null;
    if (viewingHistoryTransaction.type === 'EXPENSE') {
      const live = expenses.find((e) => e.id === viewingHistoryTransaction.data.id);
      return live ? { type: 'EXPENSE' as const, data: live } : viewingHistoryTransaction;
    } else {
      const live = settlements.find((s) => s.id === viewingHistoryTransaction.data.id);
      return live ? { type: 'SETTLEMENT' as const, data: live } : viewingHistoryTransaction;
    }
  }, [viewingHistoryTransaction, expenses, settlements]);

  const handleOpenSettleUp = useCallback((debt?: SimplifiedDebt | null) => {
    setSelectedDebtToSettle(debt || null);
    setIsSettleUpOpen(true);
  }, []);

  const handleInviteSubmit = async (email: string) => {
    if (!group || !currentUser) return;
    if (isOwner) {
      const inviteId = `inv_${Date.now()}`;
      await proposeInvite({
        id: inviteId,
        invitedEmail: email,
        invitedByEmail: currentUser.email,
        invitedByName: currentUser.name,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      });
      await approveInvite({ inviteId, approverEmail: currentUser.email });
    } else {
      await proposeInvite({
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        invitedEmail: email,
        invitedByEmail: currentUser.email,
        invitedByName: currentUser.name,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      });
    }
  };

  // Group context value
  const contextValue: GroupContextValue | null = useMemo(() => {
    if (!group) return null;
    return {
      group,
      expenses,
      settlements,
      financialSummary,
      currentUser,
      isOwner,
      currency,
      onNavigateToTab: setTab,
      addExpense,
      updateExpense,
      deleteExpense,
      addSettlement,
      updateSettlement,
      deleteSettlement,
      proposeInvite,
      approveInvite,
      isApprovingInvite,
      updateDescription,
      isUpdatingDescription,
      updateMemberName,
      softDeleteMember,
      isSoftDeletingMember,
      restoreMember,
      isRestoringMember,
      openAddExpense: () => {
        setEditingExpense(null);
        setIsAddExpenseOpen(true);
      },
      openSettleUp: handleOpenSettleUp,
      openInviteModal: (email?: string) => {
        setInviteInitialEmail(email || '');
        setIsInviteModalOpen(true);
      },
      openEditProfile: onOpenEditProfile,
      viewTransactionHistory: (item) => setViewingHistoryTransaction(item),
      openEditExpense: (exp) => setEditingExpense(exp),
      openEditSettlement: (set) => setEditingSettlement(set),
    };
  }, [
    group,
    expenses,
    settlements,
    financialSummary,
    currentUser,
    isOwner,
    currency,
    setTab,
    addExpense,
    updateExpense,
    deleteExpense,
    addSettlement,
    updateSettlement,
    deleteSettlement,
    proposeInvite,
    approveInvite,
    isApprovingInvite,
    updateDescription,
    isUpdatingDescription,
    updateMemberName,
    softDeleteMember,
    isSoftDeletingMember,
    restoreMember,
    isRestoringMember,
    handleOpenSettleUp,
    onOpenEditProfile,
  ]);

  // Loading state
  if (isGroupLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
        <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
      </div>
    );
  }

  // Error / Not Found state
  if (groupError || !group || !contextValue) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load Group</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {groupError instanceof Error
            ? groupError.message
            : 'Unable to load group data from Google Drive. Please ensure you have access to this sheet.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="secondary" onClick={onBack}>
            Back to Groups
          </Button>
          <Button onClick={() => refetchGroup()}>Retry</Button>
        </div>
      </div>
    );
  }

  const activeSection = GROUP_SECTIONS.find((s) => s.id === activeTab);

  return (
    <GroupProvider value={contextValue}>
      <div className="space-y-6 flex-1 flex flex-col min-h-[calc(100vh-140px)]">
        <GroupHeader
          group={group}
          currentUserEmail={currentUser?.email || ''}
          financialSummary={financialSummary}
          activeTab={activeTab}
          onTabChange={setTab}
          onBack={onBack}
          onOpenAddExpense={() => {
            setEditingExpense(null);
            setIsAddExpenseOpen(true);
          }}
          onOpenSettleUp={() => handleOpenSettleUp(null)}
          onOpenInvite={() => setIsInviteModalOpen(true)}
        />

        <GroupTabsContainer
          activeTab={activeTab}
          slideDirection={slideDirection}
          dragOffset={dragOffset}
          isDragging={isDragging}
          touchHandlers={touchHandlers}
          className="flex-1 flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-24"
        >
          {activeSection ? activeSection.render() : null}
        </GroupTabsContainer>
      </div>

      {/* Floating Action Button (FAB) */}
      <FloatingActionButton
        onClick={() => {
          setEditingExpense(null);
          setIsAddExpenseOpen(true);
        }}
        ariaLabel="Add expense"
        tooltipText="Add expense"
        tabIndex={isAnyModalOpen ? -1 : 0}
        aria-hidden={isAnyModalOpen}
      />

      {/* Add / Edit Expense Modal */}
      {(isAddExpenseOpen || !!editingExpense) && (
        <AddExpenseModal
          key={editingExpense ? `edit-${editingExpense.id}` : 'new-expense'}
          isOpen={isAddExpenseOpen || !!editingExpense}
          onClose={() => {
            setIsAddExpenseOpen(false);
            setEditingExpense(null);
          }}
          members={group.members}
          currentUserEmail={currentUser?.email || ''}
          defaultCurrency={group.currency}
          initialExpense={editingExpense}
          onAddExpense={addExpense}
          onEditExpense={async (updated) => {
            await updateExpense(updated);
            setEditingExpense(null);
            setViewingHistoryTransaction({ type: 'EXPENSE', data: updated });
          }}
        />
      )}

      {/* Settle Up / Edit Settlement Modal */}
      {(isSettleUpOpen || !!editingSettlement) && (
        <SettleUpModal
          key={
            editingSettlement
              ? `edit-${editingSettlement.id}`
              : selectedDebtToSettle
              ? `${selectedDebtToSettle.fromEmail}-${selectedDebtToSettle.toEmail}-${selectedDebtToSettle.amount}`
              : 'manual-settle'
          }
          isOpen={isSettleUpOpen || !!editingSettlement}
          onClose={() => {
            setIsSettleUpOpen(false);
            setEditingSettlement(null);
            setSelectedDebtToSettle(null);
          }}
          members={group.members}
          currentUserEmail={currentUser?.email || ''}
          currency={group.currency}
          prefillDebt={selectedDebtToSettle}
          initialSettlement={editingSettlement}
          onAddSettlement={addSettlement}
          onEditSettlement={async (updated) => {
            await updateSettlement(updated);
            setEditingSettlement(null);
            setViewingHistoryTransaction({ type: 'SETTLEMENT', data: updated });
          }}
        />
      )}

      {/* Transaction Edit History Modal */}
      {currentViewingTransaction && (
        <TransactionHistoryModal
          isOpen={!!viewingHistoryTransaction}
          onClose={() => setViewingHistoryTransaction(null)}
          transaction={currentViewingTransaction}
          members={group.members}
          currency={group.currency}
          onOpenEdit={() => {
            const item = currentViewingTransaction;
            setViewingHistoryTransaction(null);
            if (item.type === 'EXPENSE') {
              setEditingExpense(item.data);
            } else {
              setEditingSettlement(item.data);
            }
          }}
          onDelete={async () => {
            const item = currentViewingTransaction;
            if (item.type === 'EXPENSE') {
              await deleteExpense({
                expenseId: item.data.id,
                editorEmail: currentUser?.email,
              });
            } else {
              await deleteSettlement({
                settlementId: item.data.id,
                editorEmail: currentUser?.email,
              });
            }
            setViewingHistoryTransaction(null);
          }}
        />
      )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => {
            setIsInviteModalOpen(false);
            setInviteInitialEmail('');
          }}
          isOwner={isOwner}
          existingMembers={group.members}
          pendingInvites={group.pendingInvites}
          currentUserEmail={currentUser?.email || ''}
          currentUserName={currentUser?.name || currentUser?.email || ''}
          onInvite={handleInviteSubmit}
          initialEmail={inviteInitialEmail}
        />
      )}
    </GroupProvider>
  );
}
