# Worker Source

## Overview
Core Cloudflare Worker backend providing zero-dependency Web Crypto VAPID signing, RFC 8291 aes128gcm push payload encryption, and REST endpoints for subscription management and notification dispatch.

## Interface
- `fetch(request: Request, env: Env): Promise<Response>`: Cloudflare Worker fetch handler routing HTTP requests.
- `GET /api/health`: Healthcheck endpoint returning worker status, timestamp, and KV/VAPID binding states.
- `GET /api/vapid-public-key`: Returns the configured VAPID public key for browser push subscription handshakes.
- `GET /api/debug?groupId=<id>`: Diagnostic endpoint returning subscription count and redacted endpoint previews.
- `POST /api/subscribe`: Subscribes a device endpoint to one or more budget group IDs in Cloudflare KV.
- `POST /api/unsubscribe`: Removes a device endpoint from specified budget group IDs in Cloudflare KV.
- `POST /api/notify`: Relays encrypted Web Push notifications to group member devices, filtering the sender, and cleaning expired endpoints.
- `KVNamespaceLike`: Interface abstraction for Cloudflare Workers KV store (get, put, delete).
- `Env`: Environment configuration binding `PUSH_SUBSCRIPTIONS`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`.
- `StoredSubscription`: Schema for persisted KV records (`userEmail`, `endpoint`, `keys`, `subscribedAt`).
- `SubscribeRequest`: Payload schema for subscription requests (`userEmail`, `groupIds`, `subscription`).
- `NotifyRequest`: Payload schema for notification dispatches (`groupId`, `groupName`, `actorEmail`, `senderEndpoint`, `includeSender`, `action`, `title`, `summary`).
- `base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string`: Encodes binary data to Base64URL without padding.
- `base64UrlDecode(str: string): Uint8Array`: Decodes Base64URL string to Uint8Array.
- `generateVapidKeys(): Promise<{ publicKey: string; privateKey: string }>`: Generates fresh ECDSA P-256 keypair in Base64URL format using Web Crypto API.
- `createVapidAuthHeader(endpoint: string, vapidSubject: string, vapidPublicKey: string, vapidPrivateKeyJwkD: string): Promise<{ authorization: string }>`: Creates signed RFC 8292 VAPID Authorization header (JWT with ES256).
- `encryptWebPushPayload(payloadText: string, userP256dhBase64Url: string, userAuthBase64Url: string): Promise<{ body: ArrayBuffer; headers: Record<string, string> }>`: Encrypts text payload via RFC 8291 (aes128gcm) with ephemeral ECDH key agreement.
- [Scripts](./scripts/README.md): CLI utility scripts for worker administration.

## Invariants
- Zero external runtime dependencies; relies strictly on standard Web Crypto API (`crypto.subtle`) and Fetch API.
- Never receives, stores, or handles Google OAuth tokens, financial amounts, or spreadsheet data.
- All push notification payloads are encrypted via aes128gcm with individual recipient keys before transmission.
- Generates fresh ephemeral ECDH keypair and 16-byte random salt per push notification recipient.
- Expired push subscriptions returning HTTP 404 or 410 from push services are automatically removed from KV.
- CORS headers allow `GET`, `POST`, and `OPTIONS` with Origin `'*'` across all endpoints.

## Side Effects
- Reads and writes subscription lists in Cloudflare KV storage (keys formatted as `group:<groupId>`).
- Performs outbound HTTPS POST requests to third-party Web Push service endpoints (FCM, Apple APNs, Mozilla autopush).
- Writes diagnostic and error logs to worker runtime console.

## Verification
- Run: `bun test`
