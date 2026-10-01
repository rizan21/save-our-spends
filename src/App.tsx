import { useState, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeProvider';
import { Navbar } from './components/common/Navbar';
import { GroupList } from './components/groups/GroupList';
import { GroupHeader } from './components/groups/GroupHeader';
import { GroupOverview } from './components/groups/GroupOverview';
import { GroupTabsContainer } from './components/groups/GroupTabsContainer';
import { useSwipeableTabs } from './hooks/useSwipeableTabs';
import { CreateGroupModal } from './components/groups/CreateGroupModal';
import { OpenGroupModal } from './components/groups/OpenGroupModal';
import { TransactionList } from './components/transactions/TransactionList';
import { AddExpenseModal } from './components/transactions/AddExpenseModal';
import { TransactionHistoryModal } from './components/transactions/TransactionHistoryModal';
import { BalancesSummary } from './components/settlements/BalancesSummary';
import { MemberSpendings } from './components/settlements/MemberSpendings';
import { SimplifiedDebtsList } from './components/settlements/SimplifiedDebtsList';
import { SettleUpModal } from './components/settlements/SettleUpModal';
import type { Expense, Settlement } from './types/transaction';
import { MemberList } from './components/members/MemberList';
import { InviteMemberModal } from './components/members/InviteMemberModal';
import { DirectSheetsLink } from './components/export/DirectSheetsLink';
import { useAuth } from './hooks/useAuth';
import { useGroups } from './hooks/useGroups';
import { useGroupDetail } from './hooks/useGroupDetail';
import { useHomeSummary } from './hooks/useHomeSummary';
import { useSheetSync } from './hooks/useSheetSync';
import type { SimplifiedDebt } from './types/balance';

import { Button } from './components/common/Button';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AlertCircle } from 'lucide-react';
import { LoginScreen } from './components/auth/LoginScreen';
import { EditProfileModal } from './components/auth/EditProfileModal';
import { usePwaInstall } from './hooks/usePwaInstall';
import { InstallAppModal } from './components/pwa/InstallAppModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { NotificationSettingsModal } from './components/notifications/NotificationSettingsModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function SpreadSpendsInner() {
  const {
    user,
    isLoading: isAuthLoading,
    error: authError,
    login,
    logout,
    updateUserName,
    resetUserNameToGoogle,
    setCustomClientId,
    getCustomClientId,
  } = useAuth();

  const {
    isOpen: isInstallModalOpen,
    isIOS,
    isAndroid,
    isStandalone,
    canPromptDirectly,
    openInstallModal,
    closeInstallModal,
    triggerInstall,
  } = usePwaInstall();

  // URL Hash Routing: #group=<groupId>
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    const hash = window.location.hash;
    const match = hash.match(/#group=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  });

  // Modal visibility states
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isOpenGroupModalOpen, setIsOpenGroupModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedDebtToSettle, setSelectedDebtToSettle] = useState<SimplifiedDebt | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);
  const [viewingHistoryTransaction, setViewingHistoryTransaction] = useState<
    | { type: 'EXPENSE'; data: Expense }
    | { type: 'SETTLEMENT'; data: Settlement }
    | null
  >(null);
  const [isMemberBalancesModalOpen, setIsMemberBalancesModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  const isAnyModalOpen =
    isCreateGroupOpen ||
    isOpenGroupModalOpen ||
    isAddExpenseOpen ||
    isSettleUpOpen ||
    isInviteModalOpen ||
    isEditProfileOpen ||
    isInstallModalOpen ||
    isMemberBalancesModalOpen ||
    isNotificationModalOpen ||
    Boolean(selectedDebtToSettle) ||
    Boolean(editingExpense) ||
    Boolean(editingSettlement) ||
    Boolean(viewingHistoryTransaction);

  const {
    activeTab,
    slideDirection,
    dragOffset,
    isDragging,
    setTab,
    touchHandlers,
  } = useSwipeableTabs({
    initialTab: 'overview',
    enabled: Boolean(selectedGroupId) && !isAnyModalOpen,
  });

  // Keep URL hash in sync with selected group
  useEffect(() => {
    const handleHashChange = () => {
      const match = window.location.hash.match(/#group=([^&]+)/);
      setSelectedGroupId(match ? decodeURIComponent(match[1]) : null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsMemberBalancesModalOpen(false);
    setTab('overview');
    window.location.hash = `#group=${encodeURIComponent(groupId)}`;
  };

  const handleBackToGroups = () => {
    setSelectedGroupId(null);
    window.location.hash = '';
  };

  // Groups query
  const {
    groups,
    isLoading: isGroupsLoading,
    isRefetching: isGroupsRefetching,
    refetch: refetchGroups,
    createGroup,
    importGroup,
  } = useGroups(user);

  // Home page aggregate balances & active settlements across all groups
  const {
    groupBalances,
    activeSettlements,
    totalYouAreOwed,
    totalYouOwe,
    currency: homeCurrency,
  } = useHomeSummary(groups, user?.email || '');

  // Group detail query & mutations
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
  } = useGroupDetail(selectedGroupId);

  const {
    recentNotification,
    clearNotification,
    lastSyncTime,
    isPushEnabled,
    notificationPermission,
    enableNotifications,
    sendTestNotification,
    triggerManualSync,
    isPushSupported,
  } = useSheetSync(selectedGroupId, user?.email);


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

  const isOwner = !!(group && user && group.ownerEmail === user.email);

  const handleSaveUserName = async (newName: string) => {
    updateUserName(newName);
    if (selectedGroupId && user) {
      try {
        await updateMemberName({ email: user.email, newName });
      } catch (err) {
        console.warn('Could not update member name in group sheet:', err);
      }
    }
  };

  const handleResetUserName = async () => {
    const updated = resetUserNameToGoogle();
    if (selectedGroupId && user && updated.name) {
      try {
        await updateMemberName({ email: user.email, newName: updated.name });
      } catch (err) {
        console.warn('Could not reset member name in group sheet:', err);
      }
    }
  };

  const handleSettleDebt = (debt: SimplifiedDebt) => {
    setSelectedDebtToSettle(debt);
    setIsSettleUpOpen(true);
  };

  const handleInviteSubmit = async (email: string) => {
    if (!group || !user) return;
    if (isOwner) {
      // Owner approval: adds directly and grants permission
      const inviteId = `inv_${Date.now()}`;
      await proposeInvite({
        id: inviteId,
        invitedEmail: email,
        invitedByEmail: user.email,
        invitedByName: user.name,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      });
      await approveInvite({ inviteId, approverEmail: user.email });
    } else {
      // Propose invite for owner approval
      await proposeInvite({
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        invitedEmail: email,
        invitedByEmail: user.email,
        invitedByName: user.name,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      });
    }
  };

  if (!user) {
    return (
      <>
        <LoginScreen
          onLogin={login}
          isLoading={isAuthLoading}
          error={authError}
          clientId={getCustomClientId()}
          onSaveClientId={setCustomClientId}
          showInstallButton={!isStandalone}
          onOpenInstall={openInstallModal}
        />
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={closeInstallModal}
          isIOS={isIOS}
          isAndroid={isAndroid}
          canPromptDirectly={canPromptDirectly}
          onTriggerInstall={triggerInstall}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <Navbar
        user={user}
        onLogin={login}
        onLogout={logout}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        showInstallButton={!isStandalone}
        onOpenInstall={openInstallModal}
      />

      {/* Offline Mode Alert */}
      <OfflineIndicator />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ErrorBoundary key={selectedGroupId || 'home'}>
          {!selectedGroupId ? (
            /* ================= Group List View ================= */
            <GroupList
              groups={groups}
              currentUserEmail={user?.email || ''}
              isLoading={isGroupsLoading}
              isRefetching={isGroupsRefetching}
              groupBalances={groupBalances}
              activeSettlements={activeSettlements}
              totalYouAreOwed={totalYouAreOwed}
              totalYouOwe={totalYouOwe}
              currency={homeCurrency}
              isPushEnabled={isPushEnabled}
              onOpenNotifications={() => setIsNotificationModalOpen(true)}
              onSelectGroup={handleSelectGroup}
              onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
              onOpenImportModal={() => setIsOpenGroupModalOpen(true)}
              onSettleDebt={(groupId, debt) => {
                handleSelectGroup(groupId);
                handleSettleDebt(debt);
              }}
              onRefresh={refetchGroups}
              onLogin={login}
            />
          ) : isGroupLoading ? (
            /* ================= Loading Group View ================= */
            <div className="space-y-4 animate-pulse">
              <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
              <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
            </div>
          ) : groupError || !group ? (
            /* ================= Group Error / Not Found View ================= */
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load Group</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {groupError instanceof Error
                  ? groupError.message
                  : "Unable to load group data from Google Drive. Please ensure you have access to this sheet."}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="secondary" onClick={handleBackToGroups}>
                  Back to Groups
                </Button>
                <Button onClick={() => refetchGroup()}>Retry</Button>
              </div>
            </div>
          ) : (
            /* ================= Group Detail View ================= */
            <div className="space-y-6 flex-1 flex flex-col min-h-[calc(100vh-140px)]">
              <GroupHeader
                group={group}
                currentUserEmail={user?.email || ''}
                financialSummary={financialSummary}
                activeTab={activeTab}
                onTabChange={setTab}
                onBack={handleBackToGroups}
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                onOpenSettleUp={() => {
                  setSelectedDebtToSettle(null);
                  setIsSettleUpOpen(true);
                }}
                onOpenInvite={() => setIsInviteModalOpen(true)}
                isPushEnabled={isPushEnabled}
                onOpenNotificationSettings={() => setIsNotificationModalOpen(true)}
                onToggleNotifications={() => setIsNotificationModalOpen(true)}
              />

              <GroupTabsContainer
                activeTab={activeTab}
                slideDirection={slideDirection}
                dragOffset={dragOffset}
                isDragging={isDragging}
                touchHandlers={touchHandlers}
                className="flex-1 flex flex-col"
              >
                {/* TAB: Overview */}
                {activeTab === 'overview' && (
                  <GroupOverview
                    group={group}
                    expenses={expenses}
                    financialSummary={financialSummary}
                    onNavigateToExpenses={() => setTab('expenses', 'left')}
                    onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                    onViewExpense={(exp) => setViewingHistoryTransaction({ type: 'EXPENSE', data: exp })}
                    onUpdateDescription={async (desc) => {
                      await updateDescription(desc);
                    }}
                    isUpdatingDescription={isUpdatingDescription}
                  />
                )}

                {/* TAB: Expenses */}
                {activeTab === 'expenses' && (
                  <TransactionList
                    expenses={expenses}
                    settlements={settlements}
                    currentUserEmail={user?.email || ''}
                    currency={group.currency}
                    members={group.members}
                    simplifiedDebts={financialSummary?.simplifiedDebts || []}
                    onOpenAddExpense={() => {
                      setEditingExpense(null);
                      setIsAddExpenseOpen(true);
                    }}
                    onSettleDebt={handleSettleDebt}
                    onEditExpense={(exp) => setEditingExpense(exp)}
                    onDeleteExpense={async (exp) => {
                      await deleteExpense({ expenseId: exp.id, editorEmail: user?.email });
                    }}
                    onEditSettlement={(set) => setEditingSettlement(set)}
                    onDeleteSettlement={async (set) => {
                      await deleteSettlement({ settlementId: set.id, editorEmail: user?.email });
                    }}
                    onViewHistory={(item) => setViewingHistoryTransaction(item)}
                  />
                )}

                {/* TAB: Balances & Settle */}
                {activeTab === 'balances' && (
                  <div className="space-y-6">
                    <BalancesSummary
                      summary={financialSummary}
                      currentUserEmail={user?.email || ''}
                      currentUserPicture={user?.picture}
                      members={group.members}
                      currency={financialSummary?.currency || group.currency}
                      isModalOpen={isMemberBalancesModalOpen}
                      onOpenModal={() => setIsMemberBalancesModalOpen(true)}
                      onCloseModal={() => setIsMemberBalancesModalOpen(false)}
                    />
                    <MemberSpendings
                      members={group.members}
                      expenses={expenses}
                      currentUserEmail={user?.email || ''}
                      currentUserPicture={user?.picture}
                      currency={financialSummary?.currency || group.currency}
                    />
                    <SimplifiedDebtsList
                      debts={financialSummary?.simplifiedDebts || []}
                      currentUserEmail={user?.email || ''}
                      members={group.members}
                      onSettleDebt={handleSettleDebt}
                    />
                  </div>
                )}

                {/* TAB: Members & Invites */}
                {activeTab === 'members' && (
                  <div className="space-y-6">
                    <MemberList
                      members={group.members}
                      pendingInvites={group.pendingInvites}
                      currentUserEmail={user?.email || ''}
                      currentUserPicture={user?.picture}
                      isOwner={isOwner}
                      onOpenInviteModal={() => setIsInviteModalOpen(true)}
                      onApproveInvite={async (inviteId) => {
                        if (user) {
                          await approveInvite({ inviteId, approverEmail: user.email });
                        }
                      }}
                      isApproving={isApprovingInvite}
                      onOpenEditProfile={() => setIsEditProfileOpen(true)}
                    />
                    <DirectSheetsLink group={group} />
                  </div>
                )}
              </GroupTabsContainer>
            </div>
          )}
        </ErrorBoundary>
      </main>

      {/* ================= MODALS ================= */}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={async (name, currency, initialMembers, description) => {
          const newSheetId = await createGroup({ name, currency, initialMembers, description });
          handleSelectGroup(newSheetId);
        }}
      />

      {/* Open / Import Shared Group Modal */}
      <OpenGroupModal
        isOpen={isOpenGroupModalOpen}
        onClose={() => setIsOpenGroupModalOpen(false)}
        onOpenGroup={async (file) => {
          await importGroup(file);
          handleSelectGroup(file.id);
        }}
      />

      {/* Add / Edit Expense Modal */}
      {group && (isAddExpenseOpen || !!editingExpense) && (
        <AddExpenseModal
          key={editingExpense ? `edit-${editingExpense.id}` : 'new-expense'}
          isOpen={isAddExpenseOpen || !!editingExpense}
          onClose={() => {
            setIsAddExpenseOpen(false);
            setEditingExpense(null);
          }}
          members={group.members}
          currentUserEmail={user?.email || ''}
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
      {group && (isSettleUpOpen || !!editingSettlement) && (
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
          currentUserEmail={user?.email || ''}
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
      {group && currentViewingTransaction && (
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
        />
      )}

      {/* Invite Member Modal */}
      {group && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          isOwner={isOwner}
          existingMembers={group.members}
          pendingInvites={group.pendingInvites}
          currentUserEmail={user?.email || ''}
          currentUserName={user?.name || user?.email || ''}
          onInvite={handleInviteSubmit}
        />
      )}

      {/* Edit Profile Modal */}
      {user && isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          user={user}
          onSaveName={handleSaveUserName}
          onResetName={handleResetUserName}
        />
      )}

      {/* Real-time Sync & Notifications Settings Modal */}
      {user && (
        <NotificationSettingsModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          groupId={selectedGroupId || groups[0]?.id}
          groupName={group?.name || 'All Groups'}
          isPushEnabled={isPushEnabled}
          notificationPermission={notificationPermission}
          isPushSupported={isPushSupported}
          lastSyncTime={lastSyncTime}
          onEnableNotifications={() => enableNotifications(groups.map((g) => g.id))}
          onSendTestNotification={() => sendTestNotification(selectedGroupId || groups[0]?.id)}
          onManualSync={triggerManualSync}
        />
      )}

      {/* PWA Install Modal for Android & iOS */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={closeInstallModal}
        isIOS={isIOS}
        isAndroid={isAndroid}
        canPromptDirectly={canPromptDirectly}
        onTriggerInstall={triggerInstall}
      />

      {/* Real-time Sheet Sync Notification Toast */}
      {recentNotification && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">{recentNotification}</span>
          </div>
          <button
            onClick={clearNotification}
            className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded-md bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 shrink-0 cursor-pointer transition-colors"
          >
            Dismiss
          </button>
        </aside>
      )}
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SpreadSpendsInner />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
