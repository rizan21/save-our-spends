import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  cacheGroups,
  getCachedGroups,
  saveImportedGroup,
  getImportedGroups,
  cacheGroupDetail,
  getCachedGroupDetail,
} from '../services/storageService';
import type { GoogleDriveFile } from '../types/google';

describe('storageService - Caching, Persistence & Fallbacks', () => {
  let mockStorage: Map<string, string>;
  const originalLocalStorage = (globalThis as any).localStorage;

  beforeEach(() => {
    mockStorage = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, val: string) => mockStorage.set(key, val),
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
    };
  });

  afterEach(() => {
    (globalThis as any).localStorage = originalLocalStorage;
  });

  const sampleFile: GoogleDriveFile = {
    id: 'sheet-drive-1',
    name: '[SpreadSpends] Europe Trip',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    webViewLink: 'https://docs.google.com/spreadsheets/d/sheet-drive-1/edit',
  };

  test('cacheGroups and getCachedGroups stores and retrieves drive file list', async () => {
    cacheGroups([sampleFile]);
    const cached = await getCachedGroups();
    expect(cached.length).toBe(1);
    expect(cached[0].id).toBe('sheet-drive-1');
    expect(cached[0].name).toBe('[SpreadSpends] Europe Trip');
  });

  test('saveImportedGroup deduplicates entries by file id', async () => {
    await saveImportedGroup(sampleFile);
    let imported = await getImportedGroups();
    expect(imported.length).toBe(1);

    // Save identical file again
    await saveImportedGroup(sampleFile);
    imported = await getImportedGroups();
    expect(imported.length).toBe(1);

    // Save different file
    const secondFile: GoogleDriveFile = {
      id: 'sheet-drive-2',
      name: '[SpreadSpends] Tokyo Trip',
      mimeType: 'application/vnd.google-apps.spreadsheet',
    };
    await saveImportedGroup(secondFile);
    imported = await getImportedGroups();
    expect(imported.length).toBe(2);
  });

  test('cacheGroupDetail and getCachedGroupDetail stores and retrieves group details by id', async () => {
    const detail = {
      group: { id: 'group-100', name: 'Cabin Weekend' },
      expenses: [{ id: 'exp-1', amount: 50 }],
    };

    cacheGroupDetail('group-100', detail);
    const cached = await getCachedGroupDetail<typeof detail>('group-100');
    expect(cached).toBeDefined();
    expect(cached?.group.name).toBe('Cabin Weekend');
    expect(cached?.expenses.length).toBe(1);

    // Non-existent key returns null
    const nonexistent = await getCachedGroupDetail('group-999');
    expect(nonexistent).toBeNull();
  });

  test('handles corrupted JSON in localStorage gracefully without throwing', async () => {
    mockStorage.set('spread_spends_groups', '{invalid-json');
    mockStorage.set('spread_spends_imported_groups', 'not-valid');
    mockStorage.set('spread_spends_group_corrupt', '{bad');

    const groups = await getCachedGroups();
    expect(groups).toEqual([]);

    const imported = await getImportedGroups();
    expect(imported).toEqual([]);

    const detail = await getCachedGroupDetail('corrupt');
    expect(detail).toBeNull();
  });

  test('falls back safely when localStorage methods throw errors', async () => {
    (globalThis as any).localStorage = {
      getItem: () => {
        throw new Error('SecurityError: LocalStorage blocked');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
      clear: () => {},
    };

    // Should not throw, should fall back to internal in-memory store
    cacheGroups([sampleFile]);
    const res = await getCachedGroups();
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('sheet-drive-1');
  });
});
