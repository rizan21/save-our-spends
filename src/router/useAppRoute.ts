import { useState, useEffect, useCallback } from 'react';
import { GROUP_TABS, type GroupTab } from '../hooks/useSwipeableTabs';

export type AppRoute =
  | { page: 'groups' }
  | { page: 'group'; groupId: string; tab?: GroupTab };

function parseHash(hash: string): AppRoute {
  if (!hash || !hash.startsWith('#')) return { page: 'groups' };
  const params = new URLSearchParams(hash.slice(1));
  const groupId = params.get('group');
  if (groupId) {
    const rawTab = params.get('tab');
    const normalizedTab = rawTab === 'members' ? 'settings' : rawTab;
    const tab =
      normalizedTab && (GROUP_TABS as readonly string[]).includes(normalizedTab)
        ? (normalizedTab as GroupTab)
        : undefined;
    return { page: 'group', groupId, tab };
  }
  return { page: 'groups' };
}

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? parseHash(window.location.hash) : { page: 'groups' }
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToGroups = useCallback(() => {
    window.location.hash = '';
  }, []);

  const navigateToGroup = useCallback((groupId: string, tab?: GroupTab) => {
    const params = new URLSearchParams({ group: groupId });
    if (tab) params.set('tab', tab);
    window.location.hash = `#${params.toString()}`;
  }, []);

  return { route, navigateToGroups, navigateToGroup };
}
