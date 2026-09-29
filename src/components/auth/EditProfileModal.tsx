import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UserAvatar } from '../common/UserAvatar';
import type { GoogleUser } from '../../types/google';
import { Check, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: GoogleUser;
  onSaveName: (newName: string) => Promise<unknown> | void;
  onResetName?: () => Promise<unknown> | void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSaveName,
  onResetName,
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

  const handleResetToGoogle = async () => {
    if (!onResetName) return;
    setIsSaving(true);
    setError(null);
    try {
      await onResetName();
      const googleName = user.googleName || user.email.split('@')[0];
      setNameInput(googleName);
      setSuccessMessage('Reset to Google account name!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset user name');
    } finally {
      setIsSaving(false);
    }
  };

  const isCustomName = user.googleName && user.name !== user.googleName;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Manage your display name and view your connected Google profile."
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Profile Picture Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="relative">
            <UserAvatar name={user.name} picture={user.picture} size="xl" />
            <div
              className="absolute -bottom-1 -right-1 bg-white border border-slate-200 rounded-full p-1 shadow-xs"
              title="Profile picture from Google"
            >
              {/* Google G icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Google Account Photo
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{user.email}</p>
            <p className="text-[11px] text-slate-400">
              Profile picture is set to your connected Google account.
            </p>
          </div>
        </div>

        {/* Edit User Name Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user-name-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              User Name / Display Name
            </label>
            <input
              id="user-name-input"
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setError(null);
              }}
              placeholder="Enter your preferred name..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs text-slate-900"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This name will be shown on expense splits, shared groups, and settlement receipts.
            </p>
          </div>

          {/* Reset to Google Name Option */}
          {user.googleName && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500">
                Google account name: <strong className="text-slate-700">{user.googleName}</strong>
              </span>
              {isCustomName && onResetName && (
                <button
                  type="button"
                  onClick={handleResetToGoogle}
                  disabled={isSaving}
                  className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 cursor-pointer hover:underline disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore</span>
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
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
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
