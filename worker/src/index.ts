import { createVapidAuthHeader, encryptWebPushPayload } from './crypto';

export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  PUSH_SUBSCRIPTIONS?: KVNamespaceLike;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
}

export interface StoredSubscription {
  userEmail: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  subscribedAt: string;
}

export interface SubscribeRequest {
  userEmail: string;
  groupIds: string[];
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

export interface NotifyRequest {
  groupId: string;
  groupName?: string;
  actorEmail?: string;
  senderEndpoint?: string;
  includeSender?: boolean;
  action: 'TRANSACTION_ADDED' | 'TRANSACTION_MODIFIED' | 'TRANSACTION_REMOVED' | 'TEST';
  title?: string;
  summary: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Health check
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return jsonResponse({
        status: 'healthy',
        time: new Date().toISOString(),
        hasKv: !!env.PUSH_SUBSCRIPTIONS,
        hasVapid: !!env.VAPID_PUBLIC_KEY && !!env.VAPID_PRIVATE_KEY,
      });
    }

    // VAPID Public Key
    if (url.pathname === '/api/vapid-public-key' && request.method === 'GET') {
      return jsonResponse({
        publicKey: env.VAPID_PUBLIC_KEY || '',
      });
    }

    // Debug: list subscriptions for a group (GET /api/debug?groupId=xxx)
    if (url.pathname === '/api/debug' && request.method === 'GET') {
      if (!env.PUSH_SUBSCRIPTIONS) {
        return jsonResponse({ error: 'KV not bound' }, 500);
      }
      const groupId = url.searchParams.get('groupId');
      if (!groupId) {
        return jsonResponse({ error: 'Missing groupId param' }, 400);
      }
      const raw = await env.PUSH_SUBSCRIPTIONS.get(`group:${groupId}`);
      const list: StoredSubscription[] = raw ? JSON.parse(raw) : [];
      // Redact full endpoints for privacy, just show count + truncated endpoint
      return jsonResponse({
        groupId,
        subscriptionCount: list.length,
        subscriptions: list.map((s) => ({
          userEmail: s.userEmail,
          endpointPreview: s.endpoint.substring(0, 60) + '...',
          subscribedAt: s.subscribedAt,
        })),
      });
    }

    // Subscribe Device to Groups
    if (url.pathname === '/api/subscribe' && request.method === 'POST') {
      if (!env.PUSH_SUBSCRIPTIONS) {
        return jsonResponse({ error: 'KV store is not configured' }, 500);
      }

      const body = (await request.json()) as SubscribeRequest;
      const { userEmail, groupIds, subscription } = body;

      if (!userEmail || !subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        return jsonResponse({ error: 'Invalid subscription payload' }, 400);
      }

      const record: StoredSubscription = {
        userEmail: userEmail.toLowerCase(),
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        subscribedAt: new Date().toISOString(),
      };

      console.log(`[subscribe] user=${userEmail} groups=${JSON.stringify(groupIds)} endpoint=${subscription.endpoint.substring(0, 50)}...`);

      // Add to each group's subscription list
      for (const groupId of groupIds || []) {
        if (!groupId) continue;
        const key = `group:${groupId}`;
        const raw = await env.PUSH_SUBSCRIPTIONS.get(key);
        let list: StoredSubscription[] = raw ? JSON.parse(raw) : [];

        // Replace if existing endpoint, else append
        list = list.filter((s) => s.endpoint !== subscription.endpoint);
        list.push(record);

        await env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify(list));
        console.log(`[subscribe] KV written: key=${key} totalSubscriptions=${list.length}`);
      }

      return jsonResponse({ success: true, registeredGroups: groupIds?.length || 0 });
    }

    // Unsubscribe Device
    if (url.pathname === '/api/unsubscribe' && request.method === 'POST') {
      if (!env.PUSH_SUBSCRIPTIONS) {
        return jsonResponse({ error: 'KV store is not configured' }, 500);
      }

      const { endpoint, groupIds } = (await request.json()) as { endpoint: string; groupIds?: string[] };
      if (!endpoint) {
        return jsonResponse({ error: 'Missing endpoint' }, 400);
      }

      // If specific groups provided, remove from those
      for (const groupId of groupIds || []) {
        const key = `group:${groupId}`;
        const raw = await env.PUSH_SUBSCRIPTIONS.get(key);
        if (raw) {
          const list: StoredSubscription[] = JSON.parse(raw);
          const filtered = list.filter((s) => s.endpoint !== endpoint);
          await env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify(filtered));
        }
      }

      return jsonResponse({ success: true });
    }

    // Dispatch Push Notification on Sheet Modification
    if (url.pathname === '/api/notify' && request.method === 'POST') {
      if (!env.PUSH_SUBSCRIPTIONS) {
        return jsonResponse({ error: 'KV store is not configured' }, 500);
      }

      const body = (await request.json()) as NotifyRequest;
      const { groupId, groupName, actorEmail, action, title, summary } = body;

      if (!groupId || !summary) {
        return jsonResponse({ error: 'Missing required parameters' }, 400);
      }

      const key = `group:${groupId}`;
      const raw = await env.PUSH_SUBSCRIPTIONS.get(key);
      if (!raw) {
        return jsonResponse({ success: true, sent: 0, reason: 'No subscriptions found for group' });
      }

      const list: StoredSubscription[] = JSON.parse(raw);
      // Determine recipients:
      // 1. If includeSender is true (test notifications), deliver to everyone
      // 2. If senderEndpoint is provided, exclude only that specific sending device (enabling multi-device push for same user)
      // 3. Fallback: exclude actorEmail if no senderEndpoint
      const recipients = list.filter((s) => {
        if (body.includeSender) return true;
        if (body.senderEndpoint) {
          return s.endpoint !== body.senderEndpoint;
        }
        if (actorEmail) {
          return s.userEmail.toLowerCase() !== actorEmail.toLowerCase();
        }
        return true;
      });

      if (recipients.length === 0) {
        return jsonResponse({ success: true, sent: 0, reason: 'No other recipients' });
      }

      const notificationPayload = JSON.stringify({
        groupId,
        groupName: groupName || 'Group',
        action,
        title: title || `${groupName || 'Spread-Spends'}: Update`,
        summary,
        actorEmail,
        timestamp: new Date().toISOString(),
      });

      const vapidPublicKey = env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
      const vapidSubject = env.VAPID_SUBJECT || 'mailto:admin@spreadspends.app';

      let sentCount = 0;
      const expiredEndpoints: string[] = [];

      await Promise.all(
        recipients.map(async (recipient) => {
          try {
            if (!vapidPublicKey || !vapidPrivateKey) {
              console.warn('VAPID keys not configured in worker environment');
              return;
            }

            const encrypted = await encryptWebPushPayload(
              notificationPayload,
              recipient.keys.p256dh,
              recipient.keys.auth
            );

            const vapidAuth = await createVapidAuthHeader(
              recipient.endpoint,
              vapidSubject,
              vapidPublicKey,
              vapidPrivateKey
            );

            const pushResponse = await fetch(recipient.endpoint, {
              method: 'POST',
              headers: {
                ...encrypted.headers,
                Authorization: vapidAuth.authorization,
              },
              body: encrypted.body,
            });

            console.log(`[notify] FCM status=${pushResponse.status} user=${recipient.userEmail} endpoint=${recipient.endpoint.substring(0, 50)}...`);

            if (pushResponse.status === 201 || pushResponse.status === 200) {
              sentCount++;
            } else if (pushResponse.status === 404 || pushResponse.status === 410) {
              // Endpoint is expired/unregistered
              console.warn(`[notify] Expired endpoint for ${recipient.userEmail} — removing from KV`);
              expiredEndpoints.push(recipient.endpoint);
            } else {
              const errBody = await pushResponse.text().catch(() => '');
              console.warn(`[notify] Push service error ${pushResponse.status} for ${recipient.userEmail}: ${errBody}`);
            }
          } catch (err) {
            console.error('Push notification delivery error:', err);
          }
        })
      );

      // Clean up expired endpoints
      if (expiredEndpoints.length > 0) {
        const cleaned = list.filter((s) => !expiredEndpoints.includes(s.endpoint));
        await env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify(cleaned));
      }

      return jsonResponse({
        success: true,
        sent: sentCount,
        recipientsTotal: recipients.length,
        cleanedExpired: expiredEndpoints.length,
      });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};
