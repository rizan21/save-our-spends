# Spread-Spends Cloudflare Worker Relay

Lightweight, zero-server Web Push notification relay and real-time sheet sync coordinator for [Spread-Spends](https://github.com/spread-spends).

---

## 🚀 Setup & Deployment

### 1. Install Wrangler
From the project root:
```bash
cd worker
bun install
```

### 2. Log in to Cloudflare
```bash
bunx wrangler login
```
*(This opens a browser tab for one-click authentication).*

### 3. Create KV Namespace for Push Subscriptions
```bash
bunx wrangler kv namespace create PUSH_SUBSCRIPTIONS
```
Wrangler will print output like:
```json
{
  "binding": "PUSH_SUBSCRIPTIONS",
  "id": "abc123def456..."
}
```
Copy the `id` into `worker/wrangler.jsonc` replacing `PUSH_SUBSCRIPTIONS_ID_PLACEHOLDER`.

### 4. Configure VAPID Keys
Generate keys if not already done:
```bash
bun run src/scripts/generateKeys.ts
```
1. Set the private key secret on Cloudflare:
   ```bash
   bunx wrangler secret put VAPID_PRIVATE_KEY
   ```
   *(Paste your private key when prompted).*
2. Add your public key to `worker/wrangler.jsonc`:
   ```json
   "vars": {
     "VAPID_PUBLIC_KEY": "YOUR_PUBLIC_KEY_HERE",
     "VAPID_SUBJECT": "mailto:your-email@example.com"
   }
   ```
3. Set your public key and worker URL in the frontend root `.env`:
   ```env
   VITE_VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY_HERE"
   VITE_NOTIFICATION_RELAY_URL="https://spread-spends-worker.<your-subdomain>.workers.dev"
   ```

### 5. Deploy
```bash
bunx wrangler deploy
```

---

## 🔒 Financial Privacy Guarantee
* The worker never receives Google OAuth access tokens or credentials.
* The worker never connects directly to Google Sheets or Google Drive.
* Payloads contain only ephemeral device endpoints and short notification summaries.
