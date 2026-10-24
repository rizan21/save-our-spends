# Services

## Overview
Core client-side service layer integrating Google Drive and Google Sheets APIs with IndexedDB persistence, Web Push / BroadcastChannel real-time sync notifications, and mock fallbacks for expense tracking and group lifecycle management.

## Interface
- `GroupService` / `groupService`: High-level orchestration service for creating groups, fetching group details, appending transactions, updating statuses, and managing invites.
- `GoogleAuthService` / `googleAuthService`: OAuth 2.0 token management, Google Identity Services initialization, demo mode switching, and token caching.
- `GoogleDriveService` / `googleDriveService`: Direct Google Drive v3 client for listing spreadsheets, creating files, searching, and granting permissions.
- `GoogleSheetsService` / `googleSheetsService`: Direct Google Sheets v4 client for reading/writing cell ranges, formatting, and batch updates.
- `MockGoogleService` / `mockGoogleService`: In-memory and local mock implementation replicating Google Drive and Sheets behavior for demo mode and tests.
- `PushNotificationService` / `pushNotificationService`: Service registering push subscriptions with the Cloudflare Worker relay and sending notification broadcasts.
- Storage helpers: `cacheGroups`, `getCachedGroups`, `saveImportedGroup`, `getImportedGroups`, `cacheGroupDetail`, `getCachedGroupDetail`.
- Service Worker registration: `registerServiceWorker`.

## Invariants
- All remote Google API calls require an active, non-expired OAuth 2.0 access token unless demo mode is enabled.
- Individual member expenses are written to dedicated isolated tabs (`Exp_<email>`) to eliminate concurrent write contention on Google Sheets.
- Deleted expenses and settlements are soft-deleted by setting status to `DELETED` with audit history appended, preserving spreadsheet row integrity.
- Mock service operations are strictly gated by `googleAuthService.getIsDemoMode()` or `VITE_DEMO_MODE`.
- Local and remote synchronization relies on `BroadcastChannel` (`spread_spends_sync`) and Web Push relay without blocking primary sheet mutations.

## Side Effects
- Network calls to Google Drive API (`drive/v3/files`) and Google Sheets API (`v4/spreadsheets`).
- Network calls to external Cloudflare Worker push relay (`/api/subscribe`, `/api/notify`).
- Mutates browser `localStorage` for OAuth token credentials, user identity, mock store, and notification preferences.
- Mutates IndexedDB stores via `idb-keyval` for caching groups and group details.
- Dispatches inter-tab messages over `BroadcastChannel` and triggers service worker Web Push events.

## Verification
- Run: `bun test`
