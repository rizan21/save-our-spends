const CACHE_NAME = 'spread-spends-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Ignore cross-origin Google API and auth requests in service worker cache
  if (
    url.origin.includes('google') ||
    url.origin.includes('googleapis') ||
    url.origin.includes('gstatic')
  ) {
    return;
  }

  // Handle SPA navigation requests: Network first with index.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cachedNavigate = await caches.match(request);
          if (cachedNavigate) return cachedNavigate;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        })
    );
    return;
  }

  // Same-origin static assets: Cache first with network fallback and dynamic caching
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Web Push Notification & Real-Time Sync Coordinator
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { summary: event.data.text() };
  }

  const { groupId, groupName, action, title, summary, actorEmail } = payload;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // 1. Broadcast sheet modification event to all open tabs of the web app
      clients.forEach((client) => {
        client.postMessage({
          type: 'SHEET_MODIFIED',
          groupId,
          groupName,
          action,
          summary,
          actorEmail,
        });
      });

      // 2. Broadcast via BroadcastChannel so all windows receive instant local sync
      try {
        if ('BroadcastChannel' in self) {
          const bc = new BroadcastChannel('spread_spends_sync');
          bc.postMessage({
            type: 'SHEET_MODIFIED',
            groupId,
            groupName,
            action,
            summary,
            actorEmail,
          });
          bc.close();
        }
      } catch {
        // Ignore BroadcastChannel errors in service worker
      }

      // 3. Determine if system notification banner should be displayed
      const isTest = action === 'TEST' || (title && title.toLowerCase().includes('test'));
      const isViewingActiveGroup = clients.some(
        (c) => c.focused && groupId && c.url.includes(groupId)
      );

      // Always show native notification on test, or when user is away from this active group tab
      if ((isTest || !isViewingActiveGroup) && summary) {
        return self.registration.showNotification(title || `${groupName || 'Spread-Spends'}: Update`, {
          body: summary,
          icon: '/pwa-192x192.png',
          badge: '/favicon.svg',
          data: {
            url: groupId ? `/#group=${groupId}` : '/',
            groupId,
          },
          tag: isTest ? `test-${Date.now()}` : (groupId ? `group-${groupId}` : 'spread-spends-notification'),
        });
      }
    })
  );
});

// Notification click: Focus existing window or open new tab navigating to the group
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

