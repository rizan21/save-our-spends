import { ExternalLink } from 'lucide-react';
import { Button } from '../common/Button';
import type { Group } from '../../types/group';

export interface DirectSheetsLinkProps {
  group: Group;
}

export function DirectSheetsLink({ group }: DirectSheetsLinkProps) {
  if (!group.driveFileUrl) return null;

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
