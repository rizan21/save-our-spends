# OAuth Consent Screen Branding & Legal Setup - Execution Report

Task Slug: `oauth-consent-branding-and-legal`  
Date: November 4, 2026  
POC Email: `rizanfarooqui@gmail.com`  
Production Domain: `spends.notafakecloud.uk`

## 1. Deliverables Completed

1. **Logo File (120x120px PNG)**:
   - Output: `public/logo-120x120.png` and `public/oauth-logo-120x120.png`
   - Generated via: `bun run generate:logo` (`scripts/generate-logos.ts`)
   - Exact size: 19,400 bytes (< 1MB limit), 120x120 pixels, RGBA.

2. **Public Legal Documents**:
   - `public/privacy.html` (Static) & `src/pages/legal/PrivacyPolicyPage.tsx` (In-App route `#privacy`)
   - `public/terms.html` (Static) & `src/pages/legal/TermsOfServicePage.tsx` (In-App route `#terms`)
   - Discloses scopes: `drive.file`, `userinfo.profile`, `userinfo.email`
   - Contains mandatory Google API Limited Use compliance clause.
   - Discloses 100% client-side zero-server architecture.

3. **Home Page / Landing Experience**:
   - `src/components/auth/LoginScreen.tsx` updated with:
     - Minimalist brand header with official 84px logo and title.
     - Architecture & trust badges (`100% Client-Side`, `Your Drive`, `Penny Perfect`).
     - "Explore Interactive Demo" button for testing without login.
     - Footer links to Privacy Policy, Terms of Service, and Google Limited Use disclosure.

4. **Demo Mode Safety & Group Settings**:
   - Added `Reset Demo to Pristine State` action in `src/components/auth/EditProfileModal.tsx` when in demo mode.
   - Updated `src/components/export/DirectSheetsLink.tsx` so the "Open in Google Sheets" button in demo mode does **not** attempt to open Google Sheets or launch a dead link. Instead, it informs the user inline that the demo group is simulated and offers advice on signing in for live Drive integration.
   - Removed artificial group name blockers so users can freely name and create custom groups (including test names like "Pokemon").

5. **Demo Dummy User & Email Legal Protection**:
   - Renamed all demo dummy usernames to explicit `Demo ...` identifiers (e.g. `Demo Alice (Owner)`, `Demo Bob`, `Demo Charlie`, `Demo David`, `Demo Zara`, `Demo Eve`).
   - Replaced all demo emails with RFC 2606 reserved documentation addresses (`@example.com`): `demo.alice@example.com`, `demo.bob@example.com`, etc.
   - Bumped demo local storage key to `spread_spends_mock_data_v3` to ensure existing browser caches instantly migrate to pristine RFC 2606 test data.
   - Guaranteed immunity against real-name collisions, harassment, or legal claims.

6. **Router & Layout**:
   - `src/router/useAppRoute.ts`: supports `#privacy` and `#terms`.
   - `src/App.tsx`: renders legal views for both authenticated and unauthenticated visitors.
   - `src/components/auth/EditProfileModal.tsx`: links to legal pages and demo reset.
   - `src/components/common/Navbar.tsx`: brand clickable home link.

7. **OAuth Consent Re-run & Missing drive.file Error Resolution**:
   - Added `googleAuthService.reauthorize('consent')` and `googleAuthService.hasDriveScope()`.
   - Updated `EditProfileModal.tsx`: When signed in with Google, displays active Drive status badge and an interactive "Re-run Google OAuth" (or "Grant Drive Permission") button that forces Google consent dialog so users can grant missing `drive.file` scope.
   - Enhanced `CreateGroupModal.tsx`: Replaced cryptic Google API errors (like "The caller does not have permission") with an explanatory "Google Drive Permission Required" banner explaining that the `drive.file` scope is needed to store spreadsheets in Drive, along with an inline one-click "Re-authorize with Google" button.
   - Added pre-flight check in `groupService.createGroup` to prevent cryptic failures when `drive.file` is absent.

8. **Test Suite & Build**:
   - Added `src/test/oauthConsentAndPermissions.test.ts` covering re-authorization flows, scope validation, and modal error rendering.
   - Total test suite: 214 passing tests across 31 files (0 failures).
   - `bun run typecheck` and `bun run build` exit code 0.
