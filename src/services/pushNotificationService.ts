export interface PushNotificationPayload {
  groupId: string;
  groupName?: string;
  actorEmail?: string;
  action: 'TRANSACTION_ADDED' | 'TRANSACTION_MODIFIED' | 'TRANSACTION_REMOVED';
  title?: string;
  summary: string;
}

const STORAGE_KEYS = {
  VAPID_KEY: 'spread_spends_vapid_public_key',
  RELAY_URL: 'spread_spends_relay_url',
  SUBSCRIPTION_STATUS: 'spread_spends_push_enabled',
};

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushNotificationService {
  public isPushSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  public getNotificationPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  public getRelayUrl(): string {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.RELAY_URL);
      if (stored) return stored;
    }
    return import.meta.env.VITE_NOTIFICATION_RELAY_URL || '';
  }

  public setRelayUrl(url: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.RELAY_URL, url);
    }
  }

  public getVapidPublicKey(): string {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.VAPID_KEY);
      if (stored) return stored;
    }
    return import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  }

  public setVapidPublicKey(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.VAPID_KEY, key);
    }
  }

  public async ensureVapidPublicKey(): Promise<string> {
    let key = this.getVapidPublicKey();
    if (!key) {
      const relayUrl = this.getRelayUrl();
      if (relayUrl) {
        try {
          const res = await fetch(`${relayUrl.replace(/\/$/, '')}/api/vapid-public-key`);
          if (res.ok) {
            const data = await res.json() as { publicKey?: string };
            if (data.publicKey) {
              key = data.publicKey;
              this.setVapidPublicKey(key);
            }
          }
        } catch {
          // ignore network failure
        }
      }
    }
    return key;
  }

  public isPushEnabledLocally(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS) === 'true';
  }

  /**
   * Subscribes device to Web Push and registers with Cloudflare Worker.
   */
  public async subscribeDevice(userEmail: string, groupIds: string[]): Promise<boolean> {
    if (!this.isPushSupported()) {
      console.warn('[push] Push not supported in this browser');
      return false;
    }

    const permission = await this.requestPermission();
    console.log('[push] Notification permission:', permission);
    if (permission !== 'granted') return false;

    const vapidKey = await this.ensureVapidPublicKey();
    const relayUrl = this.getRelayUrl();
    console.log('[push] vapidKey:', vapidKey ? vapidKey.substring(0, 20) + '...' : 'MISSING');
    console.log('[push] relayUrl:', relayUrl || 'MISSING');

    // If relay URL or VAPID key is not configured, mark local state and return gracefully
    if (!vapidKey || !relayUrl) {
      console.warn('[push] Missing VAPID key or relay URL — marking enabled locally only');
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATUS, 'true');
      }
      return true;
    }

    try {
      console.log('[push] Waiting for serviceWorker.ready...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[push] Service worker ready. State:', registration.active?.state);

      let subscription = await registration.pushManager.getSubscription();
      console.log('[push] Existing subscription:', subscription ? subscription.endpoint.substring(0, 60) + '...' : 'none');
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);

      if (!subscription) {
        console.log('[push] Creating new subscription...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });
        console.log('[push] New subscription created:', subscription.endpoint.substring(0, 60) + '...');
      } else {
        // Ensure subscription uses the current VAPID key
        console.log('[push] Refreshing existing subscription with current VAPID key...');
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource,
          });
          console.log('[push] Subscription refreshed:', subscription.endpoint.substring(0, 60) + '...');
        } catch (err) {
          console.warn('[push] Failed to resubscribe — unsubscribing and resubscribing fresh:', err);
          await subscription.unsubscribe().catch(() => {});
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource,
          });
          console.log('[push] Fresh subscription created:', subscription.endpoint.substring(0, 60) + '...');
        }
      }

      // Register subscription with Cloudflare Worker relay
      console.log('[push] Sending subscription to worker relay for groups:', groupIds);
      const resp = await fetch(`${relayUrl.replace(/\/$/, '')}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          groupIds,
          subscription: subscription.toJSON(),
        }),
      });

      console.log('[push] Worker relay response:', resp.status, resp.statusText);

      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        console.log('[push] Subscribe success:', data);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATUS, 'true');
        }
        return true;
      }
      const errText = await resp.text().catch(() => '');
      console.error('[push] Worker relay subscribe failed:', resp.status, errText);
      return false;
    } catch (err) {
      console.error('[push] Failed to subscribe device for push notifications:', err);
      return false;
    }
  }

  /**
   * Sends a test push notification to all subscribed devices for a group.
   */
  public async sendTestNotification(groupId: string, userEmail: string): Promise<boolean> {
    const relayUrl = this.getRelayUrl();
    if (!relayUrl) return false;
    try {
      const resp = await fetch(`${relayUrl.replace(/\/$/, '')}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          actorEmail: 'test-system@spreadspends.app',
          includeSender: true,
          action: 'TEST',
          title: 'Spread-Spends Push Test',
          summary: `Push notifications are working! Subscribed as ${userEmail}`,
        }),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  /**
   * Dispatches a sheet modification event to other group members via Cloudflare Worker.
   */
  public async notifyGroupMembers(payload: PushNotificationPayload): Promise<void> {
    // 1. Broadcast locally to all open tabs on the same origin via BroadcastChannel (0ms sync)
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('spread_spends_sync');
        channel.postMessage({
          type: 'SHEET_MODIFIED',
          ...payload,
        });
        channel.close();
      }
    } catch {
      // Ignore broadcast errors
    }

    // 2. Broadcast remotely via Cloudflare Worker relay
    const relayUrl = this.getRelayUrl();
    if (!relayUrl) {
      return; // No relay configured, skip silently
    }

    try {
      let senderEndpoint: string | undefined;
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready.catch(() => null);
        const sub = await reg?.pushManager.getSubscription().catch(() => null);
        senderEndpoint = sub?.endpoint;
      }

      await fetch(`${relayUrl.replace(/\/$/, '')}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          senderEndpoint,
        }),
      });
    } catch (err) {
      // Do not block app operations if notification dispatch encounters network issue
      console.warn('Notification relay ping failed:', err);
    }
  }
}

export const pushNotificationService = new PushNotificationService();

