import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';

import {
  cacheGroups,
  getCachedGroups,
  cacheGroupDetail,
  getCachedGroupDetail,
} from '../services/storageService';
import type { GoogleDriveFile } from '../types/google';

describe('PWA Install and Offline Viewing Infrastructure', () => {
  const publicDir = path.resolve('public');

  test('PWA Web Manifest is present, valid JSON, and meets standalone install criteria', () => {
    const manifestPath = path.join(publicDir, 'manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const rawContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(rawContent);

    expect(manifest.name).toBe('Spread-Spends');
    expect(manifest.short_name).toBe('SpreadSpends');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#10b981');
    expect(manifest.icons).toBeArray();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

    // Verify icons declared in manifest exist on disk
    for (const icon of manifest.icons) {
      const iconPath = path.join(publicDir, icon.src.replace(/^\//, ''));
      expect(fs.existsSync(iconPath)).toBe(true);
      const stat = fs.statSync(iconPath);
      expect(stat.size).toBeGreaterThan(0);
    }
  });

  test('Apple Touch Icon exists and is non-empty for iOS home screen', () => {
    const appleIconPath = path.join(publicDir, 'apple-touch-icon.png');
    expect(fs.existsSync(appleIconPath)).toBe(true);
    expect(fs.statSync(appleIconPath).size).toBeGreaterThan(0);
  });

  test('Service Worker file sw.js exists and implements caching strategies for offline viewing', () => {
    const swPath = path.join(publicDir, 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    // Precache assets
    expect(swContent).toContain('caches.open');
    expect(swContent).toContain('/index.html');
    expect(swContent).toContain('/manifest.webmanifest');
    // SPA navigation offline fallback
    expect(swContent).toContain('navigate');
    expect(swContent).toContain('skipWaiting');
    expect(swContent).toContain('clients.claim');
  });

  test('storageService caches and retrieves group detail for offline access', async () => {
    const mockGroupId = 'test_group_offline_123';
    const mockData = {
      group: {
        id: mockGroupId,
        name: 'Offline Trip',
        currency: 'USD',
        ownerEmail: 'alice@test.com',
        members: [],
        pendingInvites: [],
        createdAt: '2026-01-01',
      },
      expenses: [],
      settlements: [],
    };

    cacheGroupDetail(mockGroupId, mockData);

    // Retrieve via getCachedGroupDetail
    const retrieved = await getCachedGroupDetail<typeof mockData>(mockGroupId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.group.name).toBe('Offline Trip');
  });

  test('storageService caches and retrieves group list for offline access', async () => {
    const mockFiles: GoogleDriveFile[] = [
      {
        id: 'file_1',
        name: 'SpreadSpends_Group1',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        owners: [{ emailAddress: 'alice@test.com', displayName: 'Alice' }],
      },
    ];

    cacheGroups(mockFiles);
    const cached = await getCachedGroups();
    expect(cached).toBeArray();
    expect(cached.some((f) => f.id === 'file_1')).toBe(true);
  });

  test('Platform detection heuristics accurately recognize Android and iOS', () => {
    const isIOSAgent = (ua: string, platform: string, maxTouch: number = 0) =>
      /iphone|ipad|ipod/.test(ua.toLowerCase()) ||
      (platform === 'MacIntel' && maxTouch > 1);

    const isAndroidAgent = (ua: string) => /android/.test(ua.toLowerCase());

    // iPhone User-Agent
    const iphoneUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(isIOSAgent(iphoneUA, 'iPhone', 1)).toBe(true);
    expect(isAndroidAgent(iphoneUA)).toBe(false);

    // iPadOS User-Agent (MacIntel with touch points)
    const ipadUA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15';
    expect(isIOSAgent(ipadUA, 'MacIntel', 5)).toBe(true);

    // Android Chrome User-Agent
    const androidUA =
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    expect(isAndroidAgent(androidUA)).toBe(true);
    expect(isIOSAgent(androidUA, 'Linux armv8l', 1)).toBe(false);

    // Windows Desktop
    const desktopUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(isIOSAgent(desktopUA, 'Win32', 0)).toBe(false);
    expect(isAndroidAgent(desktopUA)).toBe(false);
  });
});
