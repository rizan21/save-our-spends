import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Link2, FolderSearch, AlertCircle, Sparkles } from 'lucide-react';
import { googlePickerService } from '../../services/googlePicker';
import { googleAuthService } from '../../services/googleAuth';
import type { GoogleDriveFile } from '../../types/google';

export interface OpenGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGroup: (file: GoogleDriveFile) => void;
}

export function OpenGroupModal({ isOpen, onClose, onOpenGroup }: OpenGroupModalProps) {
  const [sheetInput, setSheetInput] = useState('');
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractSheetId = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Match Google Sheets URL pattern: /d/([a-zA-Z0-9-_]+)
    const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }

    // Direct ID check (Google Drive IDs typically 20-50 chars, alphanumeric with - or _)
    if (/^[a-zA-Z0-9-_]{15,}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sheetId = extractSheetId(sheetInput);
    if (!sheetId) {
      setError('Please enter a valid Google Sheets URL or Spreadsheet ID.');
      return;
    }

    const file: GoogleDriveFile = {
      id: sheetId,
      name: `Imported Group (${sheetId.slice(0, 8)}...)`,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      webViewLink: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      shared: true,
    };

    onOpenGroup(file);
    onClose();
  };

  const handlePickFromDrive = async () => {
    setError(null);
    setIsPicking(true);

    try {
      if (googleAuthService.getIsDemoMode()) {
        // Demo mode: pick Goa Vacation mock sheet
        const mockFile: GoogleDriveFile = {
          id: 'mock-sheet-goa-2026',
          name: '[SpreadSpends] Goa Vacation 2026',
          mimeType: 'application/vnd.google-apps.spreadsheet',
          webViewLink: 'https://docs.google.com/spreadsheets/d/mock-sheet-goa-2026/edit',
          shared: true,
        };
        onOpenGroup(mockFile);
        onClose();
        return;
      }

      const token = googleAuthService.getAccessToken();
      const clientId = googleAuthService.getClientId();

      if (!token) {
        throw new Error('Please sign in with Google first.');
      }

      const picked = await googlePickerService.pickSpreadsheet(token, clientId);
      if (picked) {
        const file: GoogleDriveFile = {
          id: picked.id,
          name: picked.name,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          webViewLink: picked.url,
          shared: true,
        };
        onOpenGroup(file);
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to pick from Google Drive';
      setError(message);
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Open Shared Group">
      <div className="space-y-6">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          If someone shared a Spread-Spends sheet with you, open it below. Selecting or pasting
          it authorizes the sheet under Google's least-privilege <code className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.5 rounded">drive.file</code> scope.
        </p>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Option: Google Drive Picker */}
        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <FolderSearch className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Google Drive Picker</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pick any shared spreadsheet from your Drive.</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handlePickFromDrive}
            isLoading={isPicking}
            className="w-full sm:w-auto shadow-xs gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Pick from Drive</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
          <span className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">Or paste link</span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>

        {/* Secondary Option: Manual URL or ID */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Spreadsheet Link or ID
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/... or ID"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!sheetInput.trim()}>
              Open Group
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
