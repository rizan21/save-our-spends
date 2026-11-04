import { AlertCircle, Download, ShieldCheck, Database, Scale } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { Logo } from '../common/Logo';

export interface LoginScreenProps {
  onLogin: () => Promise<unknown>;
  isLoading: boolean;
  error: string | null;
  clientId?: string;
  onSaveClientId?: (id: string) => void;
  showInstallButton?: boolean;
  onOpenInstall?: () => void;
  onDemoLogin?: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToTerms?: () => void;
}

export function LoginScreen({
  onLogin,
  isLoading,
  error,
  showInstallButton,
  onOpenInstall,
  onDemoLogin,
  onNavigateToPrivacy,
  onNavigateToTerms,
}: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between items-center p-4 sm:p-6 text-slate-800 dark:text-slate-100 relative transition-colors selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar with Theme Toggle */}
      <header className="w-full max-w-5xl flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-200">
            Save Our Spends
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-lg my-auto py-6 space-y-6">
        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 space-y-6">
          {/* App Logo & Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Logo size={84} className="drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Save Our Spends
              </h1>
            </div>
          </div>

          {/* Architecture & Trust Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                100% Client-Side
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Zero Servers</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                Your Drive
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Full Ownership</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                Penny Perfect
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Exact Cent Math</span>
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
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-2xl transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-50"
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

            {/* Interactive Demo Mode Button (Permits reviewer exploration without Google Login) */}
            {onDemoLogin && (
              <button
                type="button"
                onClick={onDemoLogin}
                className="w-full py-2.5 px-4 bg-slate-100/90 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl transition-all border border-slate-200 dark:border-slate-750 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>No Login Interactive demo</span>
              </button>
            )}
          </div>

          {/* Install App Prompt */}
          {showInstallButton && onOpenInstall && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onOpenInstall}
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Install Web App (PWA)</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Public Footer: Branding, Legal & Google Compliance */}
      <footer className="w-full max-w-5xl py-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <a
            href="/privacy.html"
            onClick={(e) => {
              if (onNavigateToPrivacy) {
                e.preventDefault();
                onNavigateToPrivacy();
              }
            }}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Privacy Policy
          </a>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <a
            href="/terms.html"
            onClick={(e) => {
              if (onNavigateToTerms) {
                e.preventDefault();
                onNavigateToTerms();
              }
            }}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Terms of Service
          </a>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Google API Limited Use Disclosure
          </a>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Save Our Spends is 100% client-side &amp; open source under the MIT License. Your financial data stays in your Google Drive.
        </p>
      </footer>
    </div>
  );
}
