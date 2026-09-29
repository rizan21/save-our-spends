// Google Picker API Integration for selecting shared spreadsheets under drive.file scope
import type { GooglePickerResponse } from '../types/google';

export class GooglePickerService {
  private isLoaded = false;

  private async loadGapiPicker(): Promise<void> {
    if (this.isLoaded && window.google?.picker) return;

    if (!window.gapi) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.head.appendChild(script);
      });
    }

    if (window.gapi) {
      await new Promise<void>((resolve) => {
        window.gapi!.load('picker', () => {
          this.isLoaded = true;
          resolve();
        });
      });
    }
  }

  /**
   * Opens the Google Drive Picker dialog for selecting a spreadsheet.
   * Selecting a file through the Picker automatically authorizes it under the drive.file scope.
   */
  public async pickSpreadsheet(
    token: string,
    clientId: string,
    developerKey?: string
  ): Promise<{ id: string; name: string; url: string } | null> {
    await this.loadGapiPicker();

    if (!window.google?.picker) {
      throw new Error('Google Picker library is not available');
    }

    return new Promise((resolve) => {
      const view = new window.google!.picker!.DocsView(window.google!.picker!.ViewId.SPREADSHEETS)
        .setMimeTypes('application/vnd.google-apps.spreadsheet');

      const builder = new window.google!.picker!.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setTitle('Select a Spread-Spends Group Spreadsheet')
        .setCallback((data: GooglePickerResponse) => {
          if (data.action === window.google!.picker!.Action.PICKED && data.docs && data.docs[0]) {
            const doc = data.docs[0];
            resolve({
              id: doc.id,
              name: doc.name,
              url: doc.url,
            });
          } else if (data.action === window.google!.picker!.Action.CANCEL) {
            resolve(null);
          }
        });

      const appId = clientId.split('-')[0] || '';
      if (appId) {
        builder.setAppId(appId);
      }

      if (developerKey) {
        builder.setDeveloperKey(developerKey);
      }

      const picker = builder.build();
      picker.setVisible(true);
    });
  }
}

export const googlePickerService = new GooglePickerService();
