import { Table, LogIn } from 'lucide-react';
import { Button } from './Button';
import { UserAvatar } from './UserAvatar';
import { ThemeToggle } from './ThemeToggle';
import type { GoogleUser } from '../../types/google';

export interface NavbarProps {
  user: GoogleUser | null;
  onLogin: () => void;
  onLogout?: () => void;
  onOpenEditProfile?: () => void;
  showInstallButton?: boolean;
  onOpenInstall?: () => void;
}

export function Navbar({
  user,
  onLogin,
  onOpenEditProfile,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Table className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Spread-Spends</span>
        </div>

        {/* User Profile / Theme Toggle / Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <button
              type="button"
              onClick={onOpenEditProfile}
              aria-label="Edit user profile"
              title="Account & Profile"
              className="p-1 rounded-full hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              <UserAvatar name={user.name} picture={user.picture} size="sm" />
            </button>
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
