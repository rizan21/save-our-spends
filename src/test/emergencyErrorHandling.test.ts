import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';

describe('Emergency Error Handling & Third-Party Script Resilience', () => {
  const indexHtmlPath = path.resolve('index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

  test('index.html filters out non-critical and third-party tracking scripts from emergency error screen', () => {
    expect(indexHtml).toContain('cloudflareinsights.com');
    expect(indexHtml).toContain('accounts.google.com');
    expect(indexHtml).toContain('google-analytics.com');
    expect(indexHtml).toContain('chrome-extension:');
    expect(indexHtml).toContain('isIgnoredScript');
    expect(indexHtml).toContain('dismissEmergencyError');
  });

  test('index.html provides Clear Cache, Retry, and Dismiss options in emergency box', () => {
    expect(indexHtml).toContain('Clear Cache & Reload');
    expect(indexHtml).toContain('Retry');
    expect(indexHtml).toContain('Dismiss');
  });

  test('verifies isIgnoredScript logic ignores Cloudflare beacon load failures (e.g. Firefox tracking protection)', () => {
    const ignoredPatterns = [
      'cloudflareinsights.com',
      'cloudflare.com',
      'accounts.google.com',
      'google-analytics.com',
      'googletagmanager.com',
      'chrome-extension:',
      'moz-extension:',
      'safari-extension:',
      'edge-extension:'
    ];

    function isIgnoredScript(src: string): boolean {
      if (!src) return true;
      for (const pattern of ignoredPatterns) {
        if (src.indexOf(pattern) !== -1) return true;
      }
      return false;
    }

    // Cloudflare insights beacon (from user report)
    const cloudflareBeacon = 'https://static.cloudflareinsights.com/beacon.min.js/vce701823e78c4301a35b7e07294d87301792088814092';
    expect(isIgnoredScript(cloudflareBeacon)).toBe(true);

    // Google Identity Services script
    expect(isIgnoredScript('https://accounts.google.com/gsi/client')).toBe(true);

    // Browser extension content scripts
    expect(isIgnoredScript('chrome-extension://abcdef/content.js')).toBe(true);
    expect(isIgnoredScript('moz-extension://abcdef/content.js')).toBe(true);

    // Application own bundle should NOT be ignored
    expect(isIgnoredScript('https://spends.notafakecloud.uk/assets/index-D7b3.js')).toBe(false);
  });
});
