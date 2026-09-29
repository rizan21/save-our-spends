import { ExternalLink, Sheet, CheckCircle, Database } from 'lucide-react';
import { Button } from '../common/Button';
import type { Group } from '../../types/group';

export interface DirectSheetsLinkProps {
  group: Group;
}

export function DirectSheetsLink({ group }: DirectSheetsLinkProps) {
  if (!group.driveFileUrl) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
          <Sheet className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Raw Google Spreadsheet Access
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            All your group data lives natively in your Google Drive. There is no middleman database,
            giving you 100% data ownership, privacy, and freedom to customize.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-slate-800">Human Readable</strong>
            <span className="text-slate-500">
              Clean column headers and formatted summary tabs.
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
          <Database className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-slate-800">Built-in Formulas</strong>
            <span className="text-slate-500">
              Native Google Sheets formulas calculate group totals automatically.
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
          <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-slate-800">Export & Backup</strong>
            <span className="text-slate-500">
              Download as spreadsheet (.xlsx), CSV, or PDF whenever you want.
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <a
          href={group.driveFileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block"
        >
          <Button className="gap-2 shadow-sm">
            <ExternalLink className="w-4 h-4" />
            <span>Open in Google Sheets</span>
          </Button>
        </a>
      </div>
    </div>
  );
}
