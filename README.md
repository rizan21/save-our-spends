# Spread-Spends 📊💸

> A fast, snappy, decentralized group expense sharing web app backed entirely by **Google Sheets** and **Google Drive**.

Zero backend servers, zero hosting costs, 100% data ownership, and complete financial privacy.

---

## ✨ Key Features

- **Google Sheets as the Database**:
  - Each group is a structured spreadsheet created on the group owner's Google account.
  - Formatted tabs: `Summary_Dashboard`, `Expenses`, `Members`, `Settlements`, `Pending_Invites`, and `Group_Config`.
  - Native Google Sheets formulas auto-compute totals in the raw sheet for direct spreadsheet users.
- **Extensible Invite & Permission Workflow**:
  - Groups are invite-only.
  - The group owner can grant edit permissions immediately via Google Drive API (`drive.permissions.create` with `role: 'writer'`).
  - Any member can propose/invite others. Member invites enter a `Pending_Invites` queue.
  - The group owner receives an in-app alert and approves the request with a single click, automatically granting Google Drive writer permissions.
- **Drive Auto-Discovery & Instant Links**:
  - Scans Google Drive for `[SpreadSpends]` spreadsheets (both owned and shared with you).
  - Shareable group links (`#group=<sheetId>`) for direct navigation.
- **Full Expense Split Engine**:
  - Split methods: **Equal**, **Exact amounts**, **Percentages**, and **Shares**.
  - Exact cent/penny conservation algorithm (no lost or gained cents).
  - Multi-payer support (bills split across multiple contributors).
  - Greedy Min-Cash-Flow debt simplification (settle debts in minimal transactions).
  - Settle up payments (Cash, UPI, Bank Transfer, Digital Wallet).
- **Blazing Fast & Snappy (0ms Perceived Latency)**:
  - **Optimistic UI Updates**: TanStack Query immediately renders new transactions and updates balances; syncs to Google Sheets in background with automatic rollback on error.
  - **Warm Starts with IndexedDB (`idb-keyval`)**: Cached groups load in 0ms on startup.
- **Built-in Interactive Demo Mode**:
  - Test the entire app, member permissions, and split calculations with realistic mock data ("Goa Vacation 2026") without needing any Google Cloud credentials!

---

## 🚀 Quick Start (Powered by Bun)

### 1. Install Dependencies
```bash
bun install
```

### 2. Run the Development Server
```bash
bun run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The app defaults to **Demo Mode** with pre-populated data and sample transactions.

### 3. Run Automated Tests
```bash
bun test
```
All unit and integration tests run in under **10 milliseconds**!

### 4. Production Build
```bash
bun run build
```

---

## ⚙️ Google Cloud OAuth Setup (Optional for Live Drive Mode)

To use your real Google Drive and Google Sheets instead of Demo Mode:

1. Visit the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Create a new Google Cloud project (or use an existing one).
3. Enable the **Google Sheets API** and **Google Drive API** under **APIs & Services > Library**.
4. Configure the **OAuth Consent Screen**:
   - User Type: **External** (or Internal for Google Workspace).
   - Add least-privilege scopes (avoids expensive CASA Tier-2 security audits!):
     - `https://www.googleapis.com/auth/userinfo.profile`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/drive.file` (Per-file access only; no whole-drive access)
5. Go to **Credentials > Create Credentials > OAuth client ID**:
   - Application type: **Web application**.
   - Under **Authorized JavaScript origins**, add your origin:
     - `http://localhost:5173` (for local development)
     - `https://your-domain.com` (for production)
6. Copy the **Client ID** and either:
   - Create a `.env` file: `VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`
   - OR click **Settings** in the app header and paste it directly!

---

## 📐 Google Sheets Schema & Concurrency Isolation

To eliminate Google Sheets write collisions and race conditions between concurrent users, Spread-Spends uses an **isolated per-person worksheet architecture**:

| Tab Name | Purpose | Concurrency Strategy |
|---|---|---|
| `Exp_<email>` | Isolated personal expense ledger per member | **Zero write contention**: Each member writes strictly to their own personal tab |
| `All_Expenses` | Master chronological ledger view | Auto-generated Google Sheets formula: `=SORT(VSTACK(Exp_1!A2:M, ...), 2, FALSE)` |
| `Members` | Active group members | Email, Display Name, Role (`OWNER`/`MEMBER`), Status, Added By, Joined At |
| `Settlements` | Direct debt settlements | ID, Date, Payer, Payee, Amount, Currency, Payment Method, Notes, Status |
| `Pending_Invites` | Member proposals awaiting owner approval | Invite ID, Invited Email, Invited By, Status, Requested At, Approved At |
| `Group_Config` | Metadata & Schema version | `app_signature`, `schema_version`, `group_id`, `group_name`, `default_currency`, `owner_email` |

* **Single-roundtrip batch reads**: The web app queries all member tabs at once using `spreadsheets.values.batchGet`.
* **Collaborator Onboarding**: Collaborators easily open shared sheets via the **Google Drive Picker** ("Open Shared"), instantly authorizing them under `drive.file`.

---

## 🧪 Architecture & Test Suite

```
src/
├── types/           # Strongly-typed domain interfaces (Group, Expense, Settlement, Balance)
├── core/            # Precision math & serialization engines
│   ├── splitCalculator.ts   # Equal, Exact, Percent, Shares split with penny rounding
│   ├── debtSimplifier.ts    # Greedy Min-Cash-Flow graph algorithm
│   └── sheetSerializer.ts   # TS models <-> Google Sheets 2D cell arrays
├── services/        # Google APIs & Mocking
│   ├── googleAuth.ts        # Google Identity Services (GIS) OAuth 2.0 token client
│   ├── googleDrive.ts       # Drive file discovery & permission grants
│   ├── googleSheets.ts      # Sheets API v4 batch and append operations
│   ├── mockGoogleService.ts # Local mock simulating Drive & Sheets API
│   ├── storageService.ts    # IndexedDB persistent caching (idb-keyval)
│   └── groupService.ts      # Unified facade routing Demo / Live requests
├── hooks/           # Reactive state hooks with optimistic UI mutations
└── components/      # Responsive, mobile-first Tailwind UI components
```

All core components are thoroughly tested via `bun test`:
- `src/test/splitCalculator.test.ts`: Validates penny rounding, exact amounts, multi-payer contributions.
- `src/test/debtSimplifier.test.ts`: Validates circular debt resolution, multi-party debt minimization, invariant checks.
- `src/test/sheetSerializer.test.ts`: Validates roundtrip conversions between TypeScript models and Google Sheets rows.
- `src/test/mockGoogleService.test.ts`: Validates group creation, row appending, permission lifecycle.
- `src/test/groupService.test.ts`: Validates unified facade and invite approval workflows.
