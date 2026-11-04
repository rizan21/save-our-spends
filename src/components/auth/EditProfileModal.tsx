import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UserAvatar } from '../common/UserAvatar';
import type { GoogleUser } from '../../types/google';
import { Check, RotateCcw, AlertCircle, Download, LogOut, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { googleAuthService } from '../../services/googleAuth';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: GoogleUser;
  isDemoMode?: boolean;
  onResetDemo?: () => void;
  onSaveName: (newName: string) => Promise<unknown> | void;
  onResetName?: () => Promise<unknown> | void;
  onLogout?: () => void;
  showInstallButton?: boolean;
  onOpenInstall?: () => void;
  onReauthorizeGoogle?: () => Promise<unknown>;
}

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  isDemoMode,
  onResetDemo,
  onSaveName,
  onResetName: _onResetName,
  onLogout,
  showInstallButton,
  onOpenInstall,
  onReauthorizeGoogle,
}: EditProfileModalProps) {
  const [nameInput, setNameInput] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isReauthorizing, setIsReauthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);

  const hasDrivePermission = googleAuthService.hasDriveScope();

  const handleReauthorize = async () => {
    if (!onReauthorizeGoogle) return;
    setIsReauthorizing(true);
    setError(null);
    setAuthSuccessMessage(null);
    try {
      await onReauthorizeGoogle();
      setAuthSuccessMessage('Google permissions updated successfully!');
      setTimeout(() => setAuthSuccessMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-run Google OAuth');
    } finally {
      setIsReauthorizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('User name cannot be empty');
      return;
    }
    if (trimmed.length > 50) {
      setError('User name cannot exceed 50 characters');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSaveName(trimmed);
      setSuccessMessage('User name updated successfully!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user name');
    } finally {
      setIsSaving(false);
    }
  };

  const originalName = user.googleName || user.email.split('@')[0];
  const isCustomName = Boolean(user.googleName && user.name !== user.googleName);
  const showRestore = isCustomName || nameInput !== originalName;

  const handleResetToGoogle = () => {
    setNameInput(originalName);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Compact Avatar & Email Header */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <UserAvatar name={user.name} picture={user.picture} size="md" />
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
            {user.email}
          </span>
        </div>

        {/* Edit User Name Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="user-name-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Display Name
              </label>
              {showRestore && (
                <button
                  type="button"
                  onClick={handleResetToGoogle}
                  disabled={isSaving}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer hover:underline disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore</span>
                </button>
              )}
            </div>
            <input
              id="user-name-input"
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setError(null);
              }}
              placeholder="Enter your preferred name..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Save & Cancel */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSaving}
              className="gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save</span>
            </Button>
          </div>
        </form>

        {/* Reset Demo Data Button (Only visible in Demo Mode) */}
        {isDemoMode && onResetDemo && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetDemo}
              className="w-full gap-1.5 text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </Button>
          </div>
        )}

        {/* Google OAuth & Permissions Section (Only visible when signed in with Google) */}
        {!isDemoMode && onReauthorizeGoogle && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Google Permissions
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                  hasDrivePermission
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400 font-semibold'
                }`}
              >
                {hasDrivePermission ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Drive Permission Active</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Drive Permission Missing</span>
                  </>
                )}
              </span>
            </div>

            {!hasDrivePermission && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                Your Google account is missing permission to create spreadsheets (drive.file). Re-run Google OAuth and ensure the Google Drive checkbox is checked.
              </p>
            )}

            {authSuccessMessage && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{authSuccessMessage}</span>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReauthorize}
              isLoading={isReauthorizing}
              className={`w-full gap-1.5 text-xs ${
                hasDrivePermission
                  ? 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  : 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{hasDrivePermission ? 'Re-run Google OAuth' : 'Grant Drive Permission (Re-run OAuth)'}</span>
            </Button>
          </div>
        )}

        {/* Account Actions (Install App & Sign Out) */}
        {(showInstallButton || onLogout) && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            {showInstallButton && onOpenInstall ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenInstall}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </Button>
            ) : (
              <div />
            )}

            {onLogout && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            )}
          </div>
        )}

        {/* Legal & Compliance Links */}
        <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500 space-x-2 border-t border-slate-100 dark:border-slate-800/80">
          <a
            href="/privacy.html"
            onClick={(e) => {
              e.preventDefault();
              onClose();
              window.location.hash = '#privacy';
            }}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline"
          >
            Privacy Policy
          </a>
          <span>•</span>
          <a
            href="/terms.html"
            onClick={(e) => {
              e.preventDefault();
              onClose();
              window.location.hash = '#terms';
            }}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </Modal>
  );
}
