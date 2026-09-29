import type { GoogleOAuthToken, GoogleUser } from '../types/google';

const CLIENT_ID_STORAGE_KEY = 'spread_spends_google_client_id';
const TOKEN_STORAGE_KEY = 'spread_spends_oauth_token';
const USER_STORAGE_KEY = 'spread_spends_auth_user';
const DEMO_MODE_STORAGE_KEY = 'spread_spends_demo_mode';

export const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

export interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

export class GoogleAuthService {
  private token: GoogleOAuthToken | null = null;
  private user: GoogleUser | null = null;
  private tokenClient: GoogleTokenClient | null = null;
  private isDemoMode: boolean = false;

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof localStorage === 'undefined') return;

    try {
      const demoVal = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
      const envDemo = import.meta.env.VITE_DEMO_MODE;
      if (envDemo !== undefined) {
        this.isDemoMode = envDemo === 'true';
      } else if (demoVal !== null) {
        this.isDemoMode = demoVal === 'true';
      } else {
        this.isDemoMode = false;
      }

      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (savedToken) {
        const parsed = JSON.parse(savedToken) as GoogleOAuthToken;
        const now = Date.now();
        // Check if token is still valid (give 2 min grace period)
        if (now - parsed.issuedAt < (parsed.expiresIn - 120) * 1000) {
          this.token = parsed;
          const savedUser = localStorage.getItem(USER_STORAGE_KEY);
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser) as GoogleUser;
            const customName = this.getSavedCustomName(parsedUser.email);
            if (customName) {
              parsedUser.name = customName;
            }
            this.user = parsedUser;
          }
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          this.token = null;
          this.user = null;
        }
      } else {
        this.token = null;
        this.user = null;
      }
    } catch {
      // Ignore parse errors
    }
  }

  public getSavedCustomName(email: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(`spread_spends_user_name_${email}`);
  }

  public getClientId(): string {
    if (typeof localStorage !== 'undefined') {
      const customId = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
      if (customId) return customId;
    }
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  }

  public setClientId(clientId: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
    }
  }

  public getIsDemoMode(): boolean {
    return this.isDemoMode;
  }

  public setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(enabled));
    }
    if (enabled) {
      // Mock user for demo mode with Google profile picture
      const demoEmail = 'alice.dev@gmail.com';
      const defaultName = 'Alice Dev (Demo Owner)';
      const customName = this.getSavedCustomName(demoEmail);
      this.user = {
        email: demoEmail,
        name: customName || defaultName,
        googleName: defaultName,
        picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
      };
    } else {
      this.user = null;
    }
  }

  public getCurrentUser(): GoogleUser | null {
    return this.user;
  }

  public getAccessToken(): string | null {
    if (this.isDemoMode) return 'mock_access_token_demo';
    if (!this.token) return null;
    const now = Date.now();
    if (now - this.token.issuedAt > (this.token.expiresIn - 60) * 1000) {
      return null; // Expired
    }
    return this.token.accessToken;
  }

  /**
   * Initializes GIS script and OAuth 2.0 token client
   */
  public async initClient(): Promise<void> {
    if (typeof window === 'undefined') return;
    const clientId = this.getClientId();
    if (!clientId) return;

    if (!window.google?.accounts?.oauth2) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
      });
    }

    if (window.google?.accounts?.oauth2) {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: OAUTH_SCOPES,
        callback: () => {}, // overridden in requestLogin
      });
    }
  }

  /**
   * Initiates Google Sign-In popup
   */
  public async requestLogin(): Promise<GoogleUser> {
    if (this.isDemoMode) {
      const demoEmail = 'alice.dev@gmail.com';
      const defaultName = 'Alice Dev (Demo Owner)';
      const customName = this.getSavedCustomName(demoEmail);
      this.user = {
        email: demoEmail,
        name: customName || defaultName,
        googleName: defaultName,
        picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
      };
      return this.user;
    }

    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('Google OAuth Client ID is not configured. Please add it in Settings or activate Demo Mode.');
    }

    if (!this.tokenClient) {
      await this.initClient();
    }

    if (!this.tokenClient) {
      throw new Error('Google Identity client could not be initialized.');
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) return reject(new Error('Token client not ready'));

      // Configure callback
      this.tokenClient = window.google!.accounts!.oauth2!.initTokenClient({
        client_id: clientId,
        scope: OAUTH_SCOPES,
        callback: async (resp) => {
          if (resp.error) {
            return reject(new Error(resp.error_description || resp.error));
          }
          if (!resp.access_token) {
            return reject(new Error('No access token returned'));
          }

          this.token = {
            accessToken: resp.access_token,
            expiresIn: resp.expires_in || 3599,
            tokenType: 'Bearer',
            scope: OAUTH_SCOPES,
            issuedAt: Date.now(),
          };

          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(this.token));
          }

          try {
            const profile = await this.fetchUserProfile(resp.access_token);
            this.user = profile;
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
            }
            resolve(profile);
          } catch (err) {
            reject(err);
          }
        },
      });

      this.tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  private async fetchUserProfile(token: string): Promise<GoogleUser> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error('Failed to retrieve user profile from Google');
    }
    const data = await res.json();
    const googleName = data.name || data.email;
    const customName = this.getSavedCustomName(data.email);
    return {
      email: data.email,
      name: customName || googleName,
      googleName,
      picture: data.picture,
      id: data.sub,
    };
  }

  /**
   * Updates user name while preserving profile picture and original Google details.
   */
  public updateUserName(newName: string): GoogleUser {
    if (!this.user) {
      throw new Error('No user is currently signed in');
    }
    const trimmed = newName.trim();
    if (!trimmed) {
      throw new Error('User name cannot be empty');
    }
    const googleName = this.user.googleName || this.user.name;
    this.user = {
      ...this.user,
      name: trimmed,
      googleName,
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user));
      localStorage.setItem(`spread_spends_user_name_${this.user.email}`, trimmed);
    }
    return this.user;
  }

  /**
   * Resets customized user name back to the original Google account name.
   */
  public resetUserNameToGoogle(): GoogleUser {
    if (!this.user) {
      throw new Error('No user is currently signed in');
    }
    const googleName = this.user.googleName || this.user.email.split('@')[0];
    this.user = {
      ...this.user,
      name: googleName,
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user));
      localStorage.removeItem(`spread_spends_user_name_${this.user.email}`);
    }
    return this.user;
  }

  public logout() {
    this.token = null;
    this.user = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }
}

export const googleAuthService = new GoogleAuthService();
