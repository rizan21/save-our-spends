import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from '../context/ThemeProvider';
import { parseHash } from '../router/useAppRoute';
import { LoginScreen } from '../components/auth/LoginScreen';
import { PrivacyPolicyPage } from '../pages/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from '../pages/legal/TermsOfServicePage';

describe('Google OAuth Branding and Legal Compliance Infrastructure', () => {
  const publicDir = path.resolve('public');

  test('120x120 App Logo PNG is generated, valid PNG format, under 1MB, and exactly 120x120', () => {
    const logo120Path = path.join(publicDir, 'logo-120x120.png');
    expect(fs.existsSync(logo120Path)).toBe(true);

    const buffer = fs.readFileSync(logo120Path);
    // Google requirement: <= 1MB
    expect(buffer.length).toBeLessThan(1024 * 1024);
    expect(buffer.length).toBeGreaterThan(1000);

    // Verify PNG header signature (89 50 4E 47 0D 0A 1A 0A)
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    expect(isPng).toBe(true);

    // Parse IHDR chunk for dimensions (bytes 16-23: width and height as 32-bit big-endian unsigned ints)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    expect(width).toBe(120);
    expect(height).toBe(120);

    // Verify oauth-logo-120x120.png exists too
    const oauthLogoPath = path.join(publicDir, 'oauth-logo-120x120.png');
    expect(fs.existsSync(oauthLogoPath)).toBe(true);
  });

  test('public/privacy.html complies with Google API Services User Data Policy and discloses scopes', () => {
    const privacyPath = path.join(publicDir, 'privacy.html');
    expect(fs.existsSync(privacyPath)).toBe(true);

    const content = fs.readFileSync(privacyPath, 'utf-8');

    // Mandatory Google Limited Use Statement
    expect(content).toContain('Google API Services User Data Policy');
    expect(content).toContain('Limited Use');
    expect(content).toContain('https://developers.google.com/terms/api-services-user-data-policy');

    // Disclosed Scopes
    expect(content).toContain('drive.file');
    expect(content).toContain('userinfo.profile');
    expect(content).toContain('userinfo.email');

    // Architecture Disclosures
    expect(content).toContain('100% Client-Side');
    expect(content).toContain('Google Drive');
    expect(content).toContain('Google Sheets');

    // Anti-misuse guarantees
    expect(content).toContain('Zero Third-Party Sharing');
    expect(content).toContain('No AI/ML Training');
    expect(content).toContain('No Advertisements');

    // POC and Domain details
    expect(content).toContain('rizanfarooqui@gmail.com');
    expect(content).toContain('spends.notafakecloud.uk');
  });

  test('public/terms.html provides clear open-source service terms and disclaimers', () => {
    const termsPath = path.join(publicDir, 'terms.html');
    expect(fs.existsSync(termsPath)).toBe(true);

    const content = fs.readFileSync(termsPath, 'utf-8');

    expect(content).toContain('Terms of Service');
    expect(content).toContain('Save Our Spends');
    expect(content).toContain('No Financial, Banking, or Legal Services');
    expect(content).toContain('Disclaimer of Warranties');
    expect(content).toContain('Limitation of Liability');
    expect(content).toContain('rizanfarooqui@gmail.com');
    expect(content).toContain('spends.notafakecloud.uk');
  });

  test('useAppRoute parses #privacy and #terms routes for in-app navigation', () => {
    expect(parseHash('#privacy')).toEqual({ page: 'privacy' });
    expect(parseHash('#privacy-policy')).toEqual({ page: 'privacy' });
    expect(parseHash('#terms')).toEqual({ page: 'terms' });
    expect(parseHash('#terms-of-service')).toEqual({ page: 'terms' });
    expect(parseHash('#group=group-sheet-123')).toEqual({ page: 'group', groupId: 'group-sheet-123', tab: undefined });
    expect(parseHash('#')).toEqual({ page: 'groups' });
    expect(parseHash('')).toEqual({ page: 'groups' });
  });

  test('LoginScreen renders brand overview, trust badges, and public legal links', () => {
    const html = renderToString(
      React.createElement(
        ThemeProvider,
        null,
        React.createElement(LoginScreen, {
          onLogin: async () => {},
          isLoading: false,
          error: null,
          onDemoLogin: () => {},
        })
      )
    );

    expect(html).toContain('Save Our Spends');
    expect(html).toContain('100% Client-Side');
    expect(html).toContain('Your Drive');
    expect(html).toContain('Penny Perfect');
    expect(html).toContain('Sign in with Google');
    expect(html).toContain('No Login Interactive demo');
    expect(html).toContain('/privacy.html');
    expect(html).toContain('/terms.html');
    expect(html).toContain('Google API Limited Use Disclosure');
  });

  test('PrivacyPolicyPage and TermsOfServicePage render in React with back actions', () => {
    const privacyHtml = renderToString(
      React.createElement(PrivacyPolicyPage, { onBack: () => {} })
    );
    expect(privacyHtml).toContain('Privacy Policy');
    expect(privacyHtml).toContain('Google API Services User Data Policy');
    expect(privacyHtml).toContain('rizanfarooqui@gmail.com');

    const termsHtml = renderToString(
      React.createElement(TermsOfServicePage, { onBack: () => {} })
    );
    expect(termsHtml).toContain('Terms of Service');
    expect(termsHtml).toContain('rizanfarooqui@gmail.com');
  });
});
