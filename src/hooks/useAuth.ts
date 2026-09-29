import { useState, useCallback } from 'react';
import type { GoogleUser } from '../types/google';
import { googleAuthService } from '../services/googleAuth';

export function useAuth() {
  const [user, setUser] = useState<GoogleUser | null>(() => googleAuthService.getCurrentUser());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => googleAuthService.getIsDemoMode());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await googleAuthService.requestLogin();
      setUser(profile);
      setIsDemoMode(googleAuthService.getIsDemoMode());
      return profile;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    googleAuthService.logout();
    setUser(null);
  }, []);

  const toggleDemoMode = useCallback((enabled: boolean) => {
    googleAuthService.setDemoMode(enabled);
    setIsDemoMode(enabled);
    setUser(googleAuthService.getCurrentUser());
  }, []);

  const setCustomClientId = useCallback((clientId: string) => {
    googleAuthService.setClientId(clientId);
  }, []);

  const getCustomClientId = useCallback(() => {
    return googleAuthService.getClientId();
  }, []);

  const updateUserName = useCallback((newName: string) => {
    const updated = googleAuthService.updateUserName(newName);
    setUser({ ...updated });
    return updated;
  }, []);

  const resetUserNameToGoogle = useCallback(() => {
    const updated = googleAuthService.resetUserNameToGoogle();
    setUser({ ...updated });
    return updated;
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isDemoMode,
    isLoading,
    error,
    login,
    logout,
    updateUserName,
    resetUserNameToGoogle,
    toggleDemoMode,
    setCustomClientId,
    getCustomClientId,
  };
}
