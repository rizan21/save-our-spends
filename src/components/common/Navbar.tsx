import { Table, LogIn, LogOut, Pencil, Download } from 'lucide-react';
import { Button } from './Button';
import { UserAvatar } from './UserAvatar';
import type { GoogleUser } from '../../types/google';

export interface NavbarProps {
  user: GoogleUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenEditProfile?: () => void;
  showInstallButton?: boolean;
  onOpenInstall?: () => void;
}

export function Navbar({
  user,
  onLogin,
  onLogout,
  onOpenEditProfile,
  showInstallButton,
  onOpenInstall,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Spread-Spends</span>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Expense sharing powered by your Google Sheets
            </p>
          </div>
        </div>

        {/* User Profile / Logout */}
        <div className="flex items-center gap-2">
          {showInstallButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenInstall}
              className="text-xs gap-1.5 border-emerald-300/80 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/80 shadow-xs cursor-pointer py-1.5 px-2.5"
              title="Install app for offline viewing"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Install App</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-1 py-0.2 rounded-sm hidden md:inline">
                Offline
              </span>
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onOpenEditProfile}
                className="flex items-center gap-2.5 py-1 px-2 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200/80 transition-all cursor-pointer group text-left"
                title="Edit your user name"
              >
                <UserAvatar name={user.name} picture={user.picture} size="sm" />
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 group-hover:text-emerald-700 transition-colors">
                    <span>{user.name}</span>
                    <Pencil className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Edit user name
                  </div>
                </div>
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={onLogin} className="gap-1.5">
              <LogIn className="w-4 h-4" />
              <span>Sign in</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
