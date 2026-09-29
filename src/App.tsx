import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/common/Navbar';
import { GroupList } from './components/groups/GroupList';
import { GroupHeader, type GroupTab } from './components/groups/GroupHeader';
import { GroupOverview } from './components/groups/GroupOverview';
import { CreateGroupModal } from './components/groups/CreateGroupModal';
import { OpenGroupModal } from './components/groups/OpenGroupModal';
import { TransactionList } from './components/transactions/TransactionList';
import { AddExpenseModal } from './components/transactions/AddExpenseModal';
import { BalancesSummary } from './components/settlements/BalancesSummary';
import { MemberSpendings } from './components/settlements/MemberSpendings';
import { SimplifiedDebtsList } from './components/settlements/SimplifiedDebtsList';
import { SettleUpModal } from './components/settlements/SettleUpModal';
import { MemberList } from './components/members/MemberList';
import { InviteMemberModal } from './components/members/InviteMemberModal';
import { DirectSheetsLink } from './components/export/DirectSheetsLink';
import { useAuth } from './hooks/useAuth';
import { useGroups } from './hooks/useGroups';
import { useGroupDetail } from './hooks/useGroupDetail';
import { useHomeSummary } from './hooks/useHomeSummary';
import type { SimplifiedDebt } from './types/balance';

import { Button } from './components/common/Button';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AlertCircle } from 'lucide-react';
import { LoginScreen } from './components/auth/LoginScreen';

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
    setCustomClientId,
    getCustomClientId,
  } = useAuth();

  // URL Hash Routing: #group=<groupId>
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    const hash = window.location.hash;
    const match = hash.match(/#group=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  });

  const [activeTab, setActiveTab] = useState<GroupTab>('overview');

  // Modal visibility states
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isOpenGroupModalOpen, setIsOpenGroupModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedDebtToSettle, setSelectedDebtToSettle] = useState<SimplifiedDebt | null>(null);

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
    setActiveTab('overview');
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
    addSettlement,
    proposeInvite,
    approveInvite,
    isApprovingInvite,
    updateDescription,
    isUpdatingDescription,
  } = useGroupDetail(selectedGroupId);

  const isOwner = !!(group && user && group.ownerEmail === user.email);

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
      <LoginScreen
        onLogin={login}
        isLoading={isAuthLoading}
        error={authError}
        clientId={getCustomClientId()}
        onSaveClientId={setCustomClientId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col text-slate-800">
      {/* Top Header */}
      <Navbar user={user} onLogin={login} onLogout={logout} />

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
              <div className="h-8 w-48 bg-slate-200 rounded-lg" />
              <div className="h-28 bg-white border border-slate-200 rounded-2xl" />
              <div className="h-64 bg-white border border-slate-200 rounded-2xl" />
            </div>
          ) : groupError || !group ? (
            /* ================= Group Error / Not Found View ================= */
            <div className="bg-white border border-rose-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Failed to Load Group</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
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
            <div className="space-y-6">
              <GroupHeader
                group={group}
                currentUserEmail={user?.email || ''}
                financialSummary={financialSummary}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onBack={handleBackToGroups}
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                onOpenSettleUp={() => {
                  setSelectedDebtToSettle(null);
                  setIsSettleUpOpen(true);
                }}
                onOpenInvite={() => setIsInviteModalOpen(true)}
              />

              {/* TAB: Overview */}
              {activeTab === 'overview' && (
                <GroupOverview
                  group={group}
                  expenses={expenses}
                  financialSummary={financialSummary}
                  onNavigateToExpenses={() => setActiveTab('expenses')}
                  onOpenAddExpense={() => setIsAddExpenseOpen(true)}
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
                  simplifiedDebts={financialSummary?.simplifiedDebts || []}
                  onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                  onSettleDebt={handleSettleDebt}
                />
              )}

              {/* TAB: Balances & Settle */}
              {activeTab === 'balances' && (
                <div className="space-y-6">
                  <BalancesSummary
                    summary={financialSummary}
                    currentUserEmail={user?.email || ''}
                    currency={financialSummary?.currency || group.currency}
                  />
                  <MemberSpendings
                    members={group.members}
                    expenses={expenses}
                    currentUserEmail={user?.email || ''}
                    currency={financialSummary?.currency || group.currency}
                  />
                  <SimplifiedDebtsList
                    debts={financialSummary?.simplifiedDebts || []}
                    currentUserEmail={user?.email || ''}
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
                    isOwner={isOwner}
                    onOpenInviteModal={() => setIsInviteModalOpen(true)}
                    onApproveInvite={async (inviteId) => {
                      if (user) {
                        await approveInvite({ inviteId, approverEmail: user.email });
                      }
                    }}
                    isApproving={isApprovingInvite}
                  />
                  <DirectSheetsLink group={group} />
                </div>
              )}
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

      {/* Add Expense Modal */}
      {group && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          members={group.members}
          currentUserEmail={user?.email || ''}
          defaultCurrency={group.currency}
          onAddExpense={addExpense}
        />
      )}

      {/* Settle Up Modal */}
      {group && isSettleUpOpen && (
        <SettleUpModal
          key={selectedDebtToSettle ? `${selectedDebtToSettle.fromEmail}-${selectedDebtToSettle.toEmail}-${selectedDebtToSettle.amount}` : 'manual-settle'}
          isOpen={isSettleUpOpen}
          onClose={() => {
            setIsSettleUpOpen(false);
            setSelectedDebtToSettle(null);
          }}
          members={group.members}
          currentUserEmail={user?.email || ''}
          currency={group.currency}
          prefillDebt={selectedDebtToSettle}
          onAddSettlement={addSettlement}
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
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SpreadSpendsInner />
    </QueryClientProvider>
  );
}

export default App;
