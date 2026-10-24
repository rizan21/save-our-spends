import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UserAvatar } from '../common/UserAvatar';
import type { GoogleUser } from '../../types/google';
import { Check, RotateCcw, AlertCircle, Download, LogOut } from 'lucide-react';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: GoogleUser;
  onSaveName: (newName: string) => Promise<unknown> | void;
  onResetName?: () => Promise<unknown> | void;
  onLogout?: () => void;
  showInstallButton?: boolean;
  onOpenInstall?: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSaveName,
  onResetName: _onResetName,
  onLogout,
  showInstallButton,
  onOpenInstall,
}: EditProfileModalProps) {
  const [nameInput, setNameInput] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      </div>
    </Modal>
  );
}
