import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { GoogleAuthService } from '../services/googleAuth';

describe('googleAuthService - OAuth Lifecycle, Token Expiry & Storage Sync', () => {
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

  test('setDemoMode(true) initializes mock user and provides demo access token', () => {
    const auth = new GoogleAuthService();
    expect(auth.getIsDemoMode()).toBe(false);
    expect(auth.getCurrentUser()).toBeNull();
    expect(auth.getAccessToken()).toBeNull();

    auth.setDemoMode(true);
    expect(auth.getIsDemoMode()).toBe(true);
    expect(auth.getCurrentUser()?.email).toBe('alice.dev@gmail.com');
    expect(auth.getAccessToken()).toBe('mock_access_token_demo');

    // Toggling off resets user
    auth.setDemoMode(false);
    expect(auth.getIsDemoMode()).toBe(false);
    expect(auth.getCurrentUser()).toBeNull();
  });

  test('loads valid token from localStorage with 120-second grace margin', () => {
    const now = Date.now();
    const validToken = {
      accessToken: 'valid-token-abc',
      expiresIn: 3600,
      tokenType: 'Bearer',
      scope: 'test',
      issuedAt: now - 1000 * 1000, // issued 1000s ago, expires in 3600s -> still valid
    };
    const user = {
      email: 'test@example.com',
      name: 'Test User',
      googleName: 'Test User',
    };

    mockStorage.set('spread_spends_oauth_token', JSON.stringify(validToken));
    mockStorage.set('spread_spends_auth_user', JSON.stringify(user));

    const auth = new GoogleAuthService();
    expect(auth.getCurrentUser()?.email).toBe('test@example.com');
    expect(auth.getAccessToken()).toBe('valid-token-abc');
  });

  test('purges expired token on loadState', () => {
    const now = Date.now();
    const expiredToken = {
      accessToken: 'expired-token-xyz',
      expiresIn: 3600,
      tokenType: 'Bearer',
      scope: 'test',
      issuedAt: now - 3500 * 1000, // issued 3500s ago, grace period is 120s (expiresIn - 120 = 3480s) -> expired!
    };

    mockStorage.set('spread_spends_oauth_token', JSON.stringify(expiredToken));
    mockStorage.set('spread_spends_auth_user', JSON.stringify({ email: 'test@example.com' }));

    const auth = new GoogleAuthService();
    expect(auth.getAccessToken()).toBeNull();
    expect(auth.getCurrentUser()).toBeNull();
    expect(mockStorage.has('spread_spends_oauth_token')).toBe(false);
  });

  test('getAccessToken returns null when token has less than 60 seconds remaining', () => {
    const now = Date.now();
    // Token issued 3550s ago with 3600s duration (50s remaining < 60s threshold)
    const expiringSoonToken = {
      accessToken: 'almost-expired',
      expiresIn: 3600,
      tokenType: 'Bearer',
      scope: 'test',
      issuedAt: now - 3550 * 1000,
    };

    mockStorage.set('spread_spends_oauth_token', JSON.stringify(expiringSoonToken));
    // Set grace period in loadState so it loads initially
    expiringSoonToken.issuedAt = now - 3400 * 1000;
    mockStorage.set('spread_spends_oauth_token', JSON.stringify(expiringSoonToken));

    const auth = new GoogleAuthService();
    // Artificially age the token
    (auth as any).token.issuedAt = now - 3550 * 1000;

    expect(auth.getAccessToken()).toBeNull();
  });

  test('updateUserName updates current user name and persists custom name', () => {
    const auth = new GoogleAuthService();
    auth.setDemoMode(true);

    const updated = auth.updateUserName('Alice The Explorer');
    expect(updated.name).toBe('Alice The Explorer');
    expect(updated.googleName).toBe('Alice Dev (Demo Owner)');
    expect(auth.getSavedCustomName('alice.dev@gmail.com')).toBe('Alice The Explorer');

    // Setting same name as googleName cleans up custom name key
    auth.updateUserName('Alice Dev (Demo Owner)');
    expect(auth.getSavedCustomName('alice.dev@gmail.com')).toBeNull();

    // Empty name throws error
    expect(() => auth.updateUserName('   ')).toThrow('cannot be empty');
  });

  test('resetUserNameToGoogle reverts display name to original Google name', () => {
    const auth = new GoogleAuthService();
    auth.setDemoMode(true);
    auth.updateUserName('Custom Alias');
    expect(auth.getCurrentUser()?.name).toBe('Custom Alias');

    auth.resetUserNameToGoogle();
    expect(auth.getCurrentUser()?.name).toBe('Alice Dev (Demo Owner)');
    expect(auth.getSavedCustomName('alice.dev@gmail.com')).toBeNull();
  });

  test('logout completely clears in-memory state and storage keys', () => {
    const auth = new GoogleAuthService();
    auth.setDemoMode(true);
    expect(auth.getCurrentUser()).toBeDefined();

    auth.logout();
    expect(auth.getCurrentUser()).toBeNull();
    expect(auth.getAccessToken()).toBeNull();
    expect(auth.getIsDemoMode()).toBe(false);
    expect(mockStorage.has('spread_spends_demo_mode')).toBe(false);
  });
});
