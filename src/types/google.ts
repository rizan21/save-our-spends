export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
  id?: string;
  googleName?: string;
}

export interface GoogleOAuthToken {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
  issuedAt: number; // Date.now()
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  owners?: Array<{
    emailAddress: string;
    displayName: string;
  }>;
  shared?: boolean;
}

export interface GoogleDocsView {
  setMimeTypes: (mimeTypes: string) => GoogleDocsView;
  setIncludeFolders: (include: boolean) => GoogleDocsView;
}

export interface GooglePickerBuilder {
  addView: (view: GoogleDocsView | string) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setAppId: (appId: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setCallback: (callback: (data: GooglePickerResponse) => void) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
}

export interface GooglePickerResponse {
  action: string;
  docs?: Array<{
    id: string;
    name: string;
    url: string;
    mimeType: string;
  }>;
}

declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void;
    };
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
      picker?: {
        PickerBuilder: new () => GooglePickerBuilder;
        ViewId: {
          SPREADSHEETS: string;
          DOCS: string;
        };
        Action: {
          PICKED: string;
          CANCEL: string;
        };
        DocsView: new (viewId?: string) => GoogleDocsView;
      };
    };
  }
}

