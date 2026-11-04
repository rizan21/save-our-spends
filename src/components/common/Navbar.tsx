import { LogIn } from 'lucide-react';
import { Button } from './Button';
import { UserAvatar } from './UserAvatar';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';
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
        <a
          href="#"
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          aria-label="Save Our Spends Home"
        >
          <Logo size={36} className="drop-shadow-xs" />
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Save Our Spends</span>
        </a>

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
