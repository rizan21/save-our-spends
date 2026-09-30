import React, { useState } from 'react';
import { Table, Key, CheckCircle2, ShieldCheck, ExternalLink, AlertCircle, ArrowRight, Download } from 'lucide-react';
import { Button } from '../common/Button';
import { ThemeToggle } from '../common/ThemeToggle';

export interface LoginScreenProps {
  onLogin: () => Promise<unknown>;
  isLoading: boolean;
  error: string | null;
  clientId: string;
  onSaveClientId: (id: string) => void;
  showInstallButton?: boolean;
  onOpenInstall?: () => void;
}

export function LoginScreen({
  onLogin,
  isLoading,
  error,
  clientId,
  onSaveClientId,
  showInstallButton,
  onOpenInstall,
}: LoginScreenProps) {
  const [showConfig, setShowConfig] = useState(!clientId);
  const [clientIdInput, setClientIdInput] = useState(clientId);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveClientId(clientIdInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (clientIdInput.trim()) setShowConfig(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800 dark:text-slate-100 relative transition-colors">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
            <Table className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Spread-Spends</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Expense sharing powered natively by your Google Sheets
            </p>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action: Google Sign In */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {isLoading ? 'Connecting to Google...' : 'Sign in with Google'}
            </span>
          </button>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            Sign in with your Google account to create and access your group spreadsheets.
          </p>
        </div>

        {/* Collapsible Client ID Config Box */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Google OAuth Client ID</span>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold cursor-pointer"
            >
              {showConfig ? 'Hide' : clientId ? 'Edit ID' : 'Configure'}
            </button>
          </div>

          {showConfig && (
            <form onSubmit={handleSave} className="mt-3 space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste Google Client ID here..."
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <Key className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center justify-between">
                {savedSuccess ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                  </span>
                ) : (
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1"
                  >
                    Google Cloud Console <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <Button size="sm" type="submit" variant="secondary" className="py-1 text-xs">
                  Save ID
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Value Propositions */}
        <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Why Google Sheets?
          </div>
          <ul className="space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <li className="flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Groups live in <strong className="text-slate-700 dark:text-slate-300">your Google Drive</strong>, not our servers.</span>
            </li>
            <li className="flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Invite members by email to grant Drive edit access.</span>
            </li>
            <li className="flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Export to spreadsheet/CSV anytime with formulas included.</span>
            </li>
          </ul>
        </div>

        {/* Install for Offline Viewing Prompt */}
        {showInstallButton && onOpenInstall && (
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={onOpenInstall}
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Install app for offline viewing</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
