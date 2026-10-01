import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pushNotificationService } from '../services/pushNotificationService';

export interface SheetUpdateEvent {
  groupId: string;
  groupName?: string;
  action: 'TRANSACTION_ADDED' | 'TRANSACTION_MODIFIED' | 'TRANSACTION_REMOVED';
  summary: string;
  actorEmail?: string;
  timestamp?: string;
}

export function useSheetSync(activeGroupId: string | null, currentUserEmail?: string) {
  const queryClient = useQueryClient();
  const [recentNotification, setRecentNotification] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(() =>
    pushNotificationService.isPushEnabledLocally()
  );
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    pushNotificationService.getNotificationPermission()
  );

  // 1. Listen for real-time SHEET_MODIFIED events from BroadcastChannel (0ms tab-to-tab) AND Service Worker (remote push)
  useEffect(() => {
    const handleSheetUpdate = (data: (SheetUpdateEvent & { type?: string }) | undefined) => {
      if (!data || data.type !== 'SHEET_MODIFIED') return;

      const eventGroupId = data.groupId;

      // Invalidate the group if it's currently open
      if (activeGroupId && eventGroupId === activeGroupId) {
        queryClient.invalidateQueries({ queryKey: ['group-detail', activeGroupId] });
        setLastSyncTime(new Date());

        if (data.summary) {
          setRecentNotification(data.summary);
          setTimeout(() => {
            setRecentNotification((cur) => (cur === data.summary ? null : cur));
          }, 4500);
        }
      }

      // Invalidate general groups overview queries
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    };

    // A. Local 0ms BroadcastChannel listener
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        broadcastChannel = new BroadcastChannel('spread_spends_sync');
        broadcastChannel.onmessage = (event) => {
          handleSheetUpdate(event.data);
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    // B. Service Worker message listener (forwarded from push events)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      handleSheetUpdate(event.data);
    };

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [activeGroupId, queryClient]);

  // 2. Initial sheet sync when website is first opened, active group changes, or window refocused
  useEffect(() => {
    if (activeGroupId) {
      queryClient.invalidateQueries({ queryKey: ['group-detail', activeGroupId] });
      setLastSyncTime(new Date());

      // If notification permission is already granted, ensure active group is subscribed in Cloudflare KV
      if (currentUserEmail && pushNotificationService.getNotificationPermission() === 'granted') {
        pushNotificationService.subscribeDevice(currentUserEmail, [activeGroupId]).then((ok) => {
          if (ok) {
            setIsPushEnabled(true);
            setNotificationPermission('granted');
          }
        });
      }
    }

    // Window focus / visibility change re-sync
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && activeGroupId) {
        queryClient.invalidateQueries({ queryKey: ['group-detail', activeGroupId] });
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        setLastSyncTime(new Date());
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [activeGroupId, currentUserEmail, queryClient]);

  // 3. Register device push subscription if user toggles or enables
  const enableNotifications = useCallback(async (allGroupIds: string[] = []): Promise<boolean> => {
    if (!currentUserEmail) return false;
    const groupsToSub = activeGroupId
      ? Array.from(new Set([activeGroupId, ...allGroupIds]))
      : allGroupIds;

    const success = await pushNotificationService.subscribeDevice(currentUserEmail, groupsToSub);
    setIsPushEnabled(success);
    setNotificationPermission(pushNotificationService.getNotificationPermission());
    return success;
  }, [activeGroupId, currentUserEmail]);

  const sendTestNotification = useCallback(async (overrideGroupId?: string): Promise<boolean> => {
    const targetId = overrideGroupId || activeGroupId;
    if (!targetId || !currentUserEmail) return false;
    return await pushNotificationService.sendTestNotification(targetId, currentUserEmail);
  }, [activeGroupId, currentUserEmail]);

  const triggerManualSync = useCallback(() => {
    if (activeGroupId) {
      queryClient.invalidateQueries({ queryKey: ['group-detail', activeGroupId] });
    }
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    setLastSyncTime(new Date());
  }, [activeGroupId, queryClient]);

  const clearNotification = useCallback(() => {
    setRecentNotification(null);
  }, []);

  return {
    recentNotification,
    clearNotification,
    lastSyncTime,
    isPushEnabled,
    notificationPermission,
    enableNotifications,
    sendTestNotification,
    triggerManualSync,
    isPushSupported: pushNotificationService.isPushSupported(),
  };
}
