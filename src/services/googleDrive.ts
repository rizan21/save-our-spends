import type { GoogleDriveFile } from '../types/google';

export class GoogleDriveService {
  /**
   * Discovers SpreadSpends spreadsheets in the user's Drive.
   */
  public async listSpreadSpendsFiles(token: string): Promise<GoogleDriveFile[]> {
    const q = encodeURIComponent(
      "mimeType = 'application/vnd.google-apps.spreadsheet' and name contains '[SpreadSpends]' and trashed = false"
    );
    const fields = encodeURIComponent('files(id, name, mimeType, webViewLink, owners, shared)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=50`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Drive query failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  }

  /**
   * Grants edit (writer) permissions on a file to an email address.
   */
  public async grantPermission(
    token: string,
    fileId: string,
    email: string,
    role: 'writer' | 'reader' = 'writer'
  ): Promise<{ id: string; role: string }> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=true`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        type: 'user',
        emailAddress: email,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to grant permission to ${email}: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Retrieves permissions for a file, including members' Google account photoLinks.
   */
  public async getFilePermissions(
    token: string,
    fileId: string
  ): Promise<Array<{ emailAddress?: string; photoLink?: string; displayName?: string }>> {
    try {
      const fields = encodeURIComponent('permissions(emailAddress, photoLink, displayName)');
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?fields=${fields}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.permissions || [];
    } catch {
      return [];
    }
  }
}

export const googleDriveService = new GoogleDriveService();
