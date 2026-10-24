import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeProvider';
import { Navbar } from './components/common/Navbar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginScreen } from './components/auth/LoginScreen';
import { EditProfileModal } from './components/auth/EditProfileModal';
import { InstallAppModal } from './components/pwa/InstallAppModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { useAuth } from './hooks/useAuth';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useAppRoute } from './router/useAppRoute';
import { GroupsPage } from './pages/groups/GroupsPage';
import { GroupDetailPage } from './pages/group/GroupDetailPage';
import { groupService } from './services/groupService';
import type { SimplifiedDebt } from './types/balance';
import type { GroupDataPayload } from './hooks/useGroupDetail';

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

  // App hash route: # or #group=<groupId>
  const { route, navigateToGroups, navigateToGroup } = useAppRoute();

  // Modals at app level
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedDebtToSettle, setSelectedDebtToSettle] = useState<SimplifiedDebt | null>(null);

  const selectedGroupId = route.page === 'group' ? route.groupId : null;

  const handleSaveUserName = async (newName: string) => {
    updateUserName(newName);
    if (user) {
      // 1. Optimistically update all loaded group-detail queries in React Query
      queryClient.setQueriesData<GroupDataPayload>(
        { queryKey: ['group-detail'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            group: {
              ...old.group,
              members: old.group.members.map((m) =>
                m.email.toLowerCase() === user.email.toLowerCase() ? { ...m, name: newName } : m
              ),
            },
          };
        }
      );

      // 2. Invalidate queries so background refetch aligns with sheets
      queryClient.invalidateQueries({ queryKey: ['group-detail'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });

      // 3. Persist to active group sheet
      if (selectedGroupId) {
        try {
          await groupService.updateMemberName(selectedGroupId, user.email, newName);
        } catch (err) {
          console.warn('Could not update member name in group sheet:', err);
        }
      }
    }
  };

  const handleResetUserName = async () => {
    const updated = resetUserNameToGoogle();
    if (user && updated.name) {
      queryClient.setQueriesData<GroupDataPayload>(
        { queryKey: ['group-detail'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            group: {
              ...old.group,
              members: old.group.members.map((m) =>
                m.email.toLowerCase() === user.email.toLowerCase() ? { ...m, name: updated.name } : m
              ),
            },
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ['group-detail'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });

      if (selectedGroupId) {
        try {
          await groupService.updateMemberName(selectedGroupId, user.email, updated.name);
        } catch (err) {
          console.warn('Could not reset member name in group sheet:', err);
        }
      }
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
          {route.page === 'groups' && (
            <GroupsPage
              user={user}
              onSelectGroup={(groupId, debt) => {
                setSelectedDebtToSettle(debt || null);
                navigateToGroup(groupId);
              }}
              onLogin={login}
            />
          )}

          {route.page === 'group' && (
            <GroupDetailPage
              groupId={route.groupId}
              currentUser={user}
              initialTab={route.tab || 'overview'}
              initialDebtToSettle={selectedDebtToSettle}
              onBack={() => {
                setSelectedDebtToSettle(null);
                navigateToGroups();
              }}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          user={user}
          onSaveName={handleSaveUserName}
          onResetName={handleResetUserName}
          onLogout={logout}
          showInstallButton={!isStandalone}
          onOpenInstall={() => {
            setIsEditProfileOpen(false);
            openInstallModal();
          }}
        />
      )}

      {/* PWA Install Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={closeInstallModal}
        isIOS={isIOS}
        isAndroid={isAndroid}
        canPromptDirectly={canPromptDirectly}
        onTriggerInstall={triggerInstall}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <SpreadSpendsInner />
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
