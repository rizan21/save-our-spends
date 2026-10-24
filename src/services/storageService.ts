import type { GoogleDriveFile } from '../types/google';

const GROUPS_CACHE_KEY = 'spread_spends_groups';
const IMPORTED_GROUPS_KEY = 'spread_spends_imported_groups';

const memoryStore = new Map<string, string>();

function getItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {}
  return memoryStore.get(key) ?? null;
}

function setItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {}
  memoryStore.set(key, value);
}

export const cacheGroups = (files: GoogleDriveFile[]): void => {
  setItem(GROUPS_CACHE_KEY, JSON.stringify(files));
};

export const getCachedGroups = async (): Promise<GoogleDriveFile[]> => {
  try {
    const raw = getItem(GROUPS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveImportedGroup = async (file: GoogleDriveFile): Promise<void> => {
  try {
    const existing = await getImportedGroups();
    if (!existing.some((g) => g.id === file.id)) {
      setItem(IMPORTED_GROUPS_KEY, JSON.stringify([...existing, file]));
    }
  } catch {}
};

export const getImportedGroups = async (): Promise<GoogleDriveFile[]> => {
  try {
    const raw = getItem(IMPORTED_GROUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const cacheGroupDetail = (groupId: string, data: unknown): void => {
  setItem(`spread_spends_group_${groupId}`, JSON.stringify(data));
};

export const getCachedGroupDetail = async <T = unknown>(groupId: string): Promise<T | null> => {
  try {
    const raw = getItem(`spread_spends_group_${groupId}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
