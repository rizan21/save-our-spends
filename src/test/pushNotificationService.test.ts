import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  pushNotificationService,
  urlBase64ToUint8Array,
} from '../services/pushNotificationService';

// Polyfill localStorage if running in node/bun environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] || null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('PushNotificationService & VAPID Utilities', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restore();
  });

  test('urlBase64ToUint8Array converts base64url string to byte array properly', () => {
    const sampleBase64Url = 'BOK2PEhm54Kjq_KO6SXBDv-frG8SlbNmoExhzzrshgvM';
    const bytes = urlBase64ToUint8Array(sampleBase64Url);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('persists and retrieves custom Relay URL and VAPID Public Key in localStorage', () => {
    pushNotificationService.setRelayUrl('https://my-worker.workers.dev');
    pushNotificationService.setVapidPublicKey('TEST_VAPID_PUBLIC_KEY');

    expect(pushNotificationService.getRelayUrl()).toBe('https://my-worker.workers.dev');
    expect(pushNotificationService.getVapidPublicKey()).toBe('TEST_VAPID_PUBLIC_KEY');
  });

  test('notifyGroupMembers sends POST request to configured relay without throwing on error', async () => {
    pushNotificationService.setRelayUrl('https://my-worker.workers.dev');

    let capturedUrl = '';
    let capturedBody = '';

    globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedBody = init?.body ? String(init.body) : '';
      return new Response(JSON.stringify({ success: true, sent: 2 }), { status: 200 });
    }) as unknown as typeof fetch;

    await pushNotificationService.notifyGroupMembers({
      groupId: 'sheet_trip_123',
      groupName: 'Goa Trip',
      actorEmail: 'alice@dev.com',
      action: 'TRANSACTION_ADDED',
      summary: 'Alice added "Dinner" ($45.00)',
    });

    expect(capturedUrl).toBe('https://my-worker.workers.dev/api/notify');
    const parsed = JSON.parse(capturedBody);
    expect(parsed.groupId).toBe('sheet_trip_123');
    expect(parsed.actorEmail).toBe('alice@dev.com');
    expect(parsed.action).toBe('TRANSACTION_ADDED');
    expect(parsed.summary).toBe('Alice added "Dinner" ($45.00)');
  });

  test('notifyGroupMembers gracefully handles network failure without rejecting', async () => {
    pushNotificationService.setRelayUrl('https://my-worker.workers.dev');

    globalThis.fetch = mock(async () => {
      throw new Error('Network offline');
    }) as unknown as typeof fetch;

    // Should resolve without throwing error to user
    await expect(
      pushNotificationService.notifyGroupMembers({
        groupId: 'sheet_trip_123',
        action: 'TRANSACTION_REMOVED',
        summary: 'Deleted expense',
      })
    ).resolves.toBeUndefined();
  });
});
