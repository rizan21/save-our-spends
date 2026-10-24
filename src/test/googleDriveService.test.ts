import { describe, test, expect, mock, afterEach } from 'bun:test';
import {
  googleDriveService,
  listSpreadSpendsFiles,
  grantPermission,
  getFilePermissions,
  removePermission,
} from '../services/googleDrive';

describe('googleDriveService - Google Drive REST API v3 Integration', () => {
  const originalFetch = globalThis.fetch;
  const mockToken = 'mock-drive-token-abc';
  const fileId = 'drive-file-123';

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
  });

  test('listSpreadSpendsFiles queries Drive v3 for SpreadSpends spreadsheets', async () => {
    let capturedUrl = '';
    let authHeader = '';

    (globalThis as any).fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = url.toString();
      authHeader = (init?.headers as any)?.Authorization || '';
      return new Response(
        JSON.stringify({
          files: [
            {
              id: 'file-1',
              name: '[SpreadSpends] Goa Vacation',
              mimeType: 'application/vnd.google-apps.spreadsheet',
              webViewLink: 'https://docs.google.com/spreadsheets/d/file-1/edit',
            },
          ],
        }),
        { status: 200 }
      );
    });

    const files = await listSpreadSpendsFiles(mockToken);
    expect(files.length).toBe(1);
    expect(files[0].name).toContain('Goa Vacation');
    expect(authHeader).toBe(`Bearer ${mockToken}`);

    // Verify search query includes spreadsheet mimeType, name filter, and trashed=false
    const decodedUrl = decodeURIComponent(capturedUrl);
    expect(decodedUrl).toContain("mimeType = 'application/vnd.google-apps.spreadsheet'");
    expect(decodedUrl).toContain("name contains '[SpreadSpends]'");
    expect(decodedUrl).toContain('trashed = false');
  });

  test('listSpreadSpendsFiles throws error on non-ok HTTP response', async () => {
    (globalThis as any).fetch = mock(async () => {
      return new Response(JSON.stringify({ error: { message: 'Quota exceeded' } }), {
        status: 403,
      });
    });

    expect(listSpreadSpendsFiles(mockToken)).rejects.toThrow('Quota exceeded');
  });

  test('grantPermission sends POST request with user email and specified role', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;

    (globalThis as any).fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedBody = JSON.parse(init?.body as string);
      return new Response(JSON.stringify({ id: 'perm-99', role: 'writer' }), { status: 200 });
    });

    const res = await grantPermission(mockToken, fileId, 'friend@example.com', 'writer');
    expect(res.id).toBe('perm-99');
    expect(res.role).toBe('writer');
    expect(capturedUrl).toContain(`/files/${fileId}/permissions`);
    expect(capturedUrl).toContain('sendNotificationEmail=true');
    expect(capturedBody).toEqual({
      role: 'writer',
      type: 'user',
      emailAddress: 'friend@example.com',
    });
  });

  test('grantPermission throws on permission grant failure', async () => {
    (globalThis as any).fetch = mock(async () => {
      return new Response(
        JSON.stringify({ error: { message: 'User does not have permission' } }),
        { status: 403 }
      );
    });

    expect(
      grantPermission(mockToken, fileId, 'stranger@example.com', 'writer')
    ).rejects.toThrow('User does not have permission');
  });

  test('getFilePermissions returns permission list and handles fetch errors gracefully', async () => {
    let capturedUrl = '';

    (globalThis as any).fetch = mock(async (url: string | URL | Request) => {
      capturedUrl = url.toString();
      return new Response(
        JSON.stringify({
          permissions: [
            { id: 'p1', emailAddress: 'alice@test.com', role: 'owner', type: 'user' },
            { id: 'p2', emailAddress: 'bob@test.com', role: 'writer', type: 'user' },
          ],
        }),
        { status: 200 }
      );
    });

    const permissions = await getFilePermissions(mockToken, fileId);
    expect(permissions.length).toBe(2);
    expect(permissions[1].role).toBe('writer');
    expect(capturedUrl).toContain(`/files/${fileId}/permissions?fields=`);

    // Non-ok response returns empty array instead of throwing
    (globalThis as any).fetch = mock(async () => {
      return new Response('Not found', { status: 404 });
    });

    const emptyResult = await getFilePermissions(mockToken, fileId);
    expect(emptyResult).toEqual([]);

    // Network error returns empty array
    (globalThis as any).fetch = mock(async () => {
      throw new Error('Network timeout');
    });
    const networkFailResult = await getFilePermissions(mockToken, fileId);
    expect(networkFailResult).toEqual([]);
  });

  test('removePermission sends DELETE request to permissions endpoint', async () => {
    let deleteMethod = '';
    let capturedUrl = '';

    (globalThis as any).fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      deleteMethod = init?.method || '';
      capturedUrl = url.toString();
      return new Response('', { status: 204 });
    });

    await removePermission(mockToken, fileId, 'perm-to-remove');
    expect(deleteMethod).toBe('DELETE');
    expect(capturedUrl).toContain(`/files/${fileId}/permissions/perm-to-remove`);
  });

  test('removePermission treats HTTP 404 idempotently without throwing', async () => {
    (globalThis as any).fetch = mock(async () => {
      return new Response('Permission not found', { status: 404 });
    });

    // 404 should succeed silently
    await expect(removePermission(mockToken, fileId, 'already-removed')).resolves.toBeUndefined();
  });

  test('removePermission throws on non-404 HTTP errors', async () => {
    (globalThis as any).fetch = mock(async () => {
      return new Response(JSON.stringify({ error: { message: 'Internal server error' } }), {
        status: 500,
      });
    });

    await expect(removePermission(mockToken, fileId, 'perm-err')).rejects.toThrow(
      'Internal server error'
    );
  });

  test('googleDriveService facade re-exports all drive functions', () => {
    expect(googleDriveService.listSpreadSpendsFiles).toBe(listSpreadSpendsFiles);
    expect(googleDriveService.grantPermission).toBe(grantPermission);
    expect(googleDriveService.getFilePermissions).toBe(getFilePermissions);
    expect(googleDriveService.removePermission).toBe(removePermission);
  });
});
