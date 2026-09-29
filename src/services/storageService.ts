import { get, set } from 'idb-keyval';
import type { GoogleDriveFile } from '../types/google';

const GROUPS_CACHE_KEY = 'spread_spends_groups';
const IMPORTED_GROUPS_KEY = 'spread_spends_imported_groups';

export const cacheGroups = (files: GoogleDriveFile[]): void => {
  set(GROUPS_CACHE_KEY, files).catch(() => {});
};

export const getCachedGroups = async (): Promise<GoogleDriveFile[]> => {
  try {
    return (await get<GoogleDriveFile[]>(GROUPS_CACHE_KEY)) || [];
  } catch {
    return [];
  }
};

export const saveImportedGroup = async (file: GoogleDriveFile): Promise<void> => {
  try {
    const existing = (await get<GoogleDriveFile[]>(IMPORTED_GROUPS_KEY)) || [];
    if (!existing.some((g) => g.id === file.id)) {
      await set(IMPORTED_GROUPS_KEY, [...existing, file]);
    }
  } catch {
    // Ignore storage errors
  }
};

export const getImportedGroups = async (): Promise<GoogleDriveFile[]> => {
  try {
    return (await get<GoogleDriveFile[]>(IMPORTED_GROUPS_KEY)) || [];
  } catch {
    return [];
  }
};

export const cacheGroupDetail = (groupId: string, data: unknown): void => {
  set(`spread_spends_group_${groupId}`, data).catch(() => {});
};
