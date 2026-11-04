import { useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { Button } from '../common/Button';
import type { Group } from '../../types/group';
import { googleAuthService } from '../../services/googleAuth';

export interface DirectSheetsLinkProps {
  group: Group;
  isDemo?: boolean;
}

export function DirectSheetsLink({ group, isDemo }: DirectSheetsLinkProps) {
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  if (!group.driveFileUrl) return null;

  const isDemoGroup =
    isDemo !== undefined
      ? isDemo
      : (typeof googleAuthService !== 'undefined' && googleAuthService.getIsDemoMode()) ||
        group.id.startsWith('mock-') ||
        group.driveFileUrl.includes('mock-');

  if (isDemoGroup) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowDemoNotice((prev) => !prev)}
          className="gap-1.5 shadow-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          title="Simulated demo group (not linked to Google Sheets)"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          <span>Open in Google Sheets</span>
        </Button>

        {showDemoNotice && (
          <div
            data-testid="demo-sheets-notice"
            className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 animate-fade-in"
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-semibold">Simulated Demo Group</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                In interactive demo mode, group data is simulated locally in browser memory and is not linked to a real Google Drive spreadsheet.
                Sign in with Google to create and sync real Google Sheets!
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <a
        href={group.driveFileUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-block"
      >
        <Button variant="outline" size="sm" className="gap-1.5 shadow-xs">
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open in Google Sheets</span>
        </Button>
      </a>
    </div>
  );
}
