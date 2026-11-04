# Design Draft: Google OAuth Consent Screen Branding & Legal Compliance

Task Slug: `oauth-consent-branding-and-legal`

## 1. Executive Summary

This specification defines the implementation requirements to prepare **Save Our Spends** for Google OAuth 2.0 App Verification and production publication. It covers:
1. Official square App Logo (120x120 PNG, < 1MB).
2. Public Privacy Policy compliant with the Google API Services User Data Policy and Limited Use requirements for the `drive.file` scope.
3. Public Terms of Service governing the client-side tool.
4. Application Home Page enhancements to serve as an unauthenticated landing page with app description, feature highlights, demo exploration, and legal footer links.
5. In-app and static routing for instant zero-JS crawler verification and seamless SPA navigation.

## 2. Technical Requirements & Deliverables

### A. App Logo Asset
- Path: `public/logo-120x120.png`
- Specifications:
  - Dimensions: 120 x 120 pixels.
  - Format: PNG with 32-bit RGBA transparency.
  - Source: Scaled and centered from `public/logo.svg` (Save Our Spends heavenly ascending cash icon with wings, golden halo, and radiant aura).
  - Target size: ~19 KB (< 1 MB).

### B. Legal Pages (Dual Static & SPA Routing)
- **Privacy Policy**:
  - `public/privacy.html` (Static file)
  - `/#privacy` via `src/pages/legal/PrivacyPolicyPage.tsx`
  - Scope disclosures: `userinfo.profile`, `userinfo.email`, `drive.file`.
  - Architecture disclosure: 100% client-side, zero backend servers, all data stored in user-owned Google Sheets and browser local cache.
  - Prohibition of third-party sales, advertising, and AI/ML model training.
  - Google Limited Use declaration verbatim.
  - Data deletion and OAuth revocation instructions.
- **Terms of Service**:
  - `public/terms.html` (Static file)
  - `/#terms` via `src/pages/legal/TermsOfServicePage.tsx`
  - Disclaimer of warranties (AS-IS open source tool).
  - User ownership of Google Drive spreadsheets.

### C. Home Page / Landing Experience
- File: `src/components/auth/LoginScreen.tsx`
- New components:
  - Header with official logo and tagline.
  - App overview explaining the serverless Google Sheets architecture.
  - Security and privacy highlights.
  - Sign in with Google (primary action) and "Explore Demo" (secondary action).
  - Footer with clickable links to Privacy Policy, Terms of Service, Google Limited Use policy, and GitHub repository.

### D. Router & Layout Integration
- File: `src/router/useAppRoute.ts`
  - Support `privacy` and `terms` routes.
- File: `src/App.tsx`
  - Render legal pages without requiring authentication.
- File: `src/components/auth/EditProfileModal.tsx` & `src/components/common/Navbar.tsx`
  - Accessible legal links for signed-in users.

## 3. Google Cloud Console Submission Guide
- **App name**: Save Our Spends
- **User support email**: Developer/support email
- **App logo**: Upload `public/logo-120x120.png`
- **Application home page**: `https://<domain>/`
- **Application privacy policy**: `https://<domain>/privacy.html`
- **Application terms of service**: `https://<domain>/terms.html`
- **Authorized domains**: `<domain>` (e.g., `save-our-spends.pages.dev` or custom domain)
- **Scopes**:
  - `.../auth/userinfo.profile`
  - `.../auth/userinfo.email`
  - `.../auth/drive.file`
