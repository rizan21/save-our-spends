import { Calendar, Crown } from 'lucide-react';
import type { Group } from '../../../types/group';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { Badge } from '../../../components/common/Badge';

export interface GroupInfoCardProps {
  group: Group;
  className?: string;
}

export function GroupInfoCard({ group, className = '' }: GroupInfoCardProps) {
  // Resolve owner from members list
  const ownerMember = group.members?.find(
    (m) => m.email.toLowerCase() === group.ownerEmail.toLowerCase() || m.role === 'OWNER'
  );
  const ownerName = ownerMember?.name || group.ownerEmail;
  const ownerPicture = ownerMember?.picture;

  // Format created date safely
  const formattedDate = (() => {
    if (!group.createdAt) return 'Unknown';
    const dateObj = new Date(group.createdAt);
    if (isNaN(dateObj.getTime())) return group.createdAt;
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  })();

  const hasDescription = Boolean(group.description?.trim());

  return (
    <div
      data-testid="group-info-card"
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 ${className}`}
    >
      {/* Group Description */}
      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          About Group
        </h3>
        {hasDescription ? (
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
            {group.description}
          </p>
        ) : (
          <p className="text-sm italic text-slate-400 dark:text-slate-500">
            No description provided.
          </p>
        )}
      </div>

      {/* Metadata Row: Owner & Creation Date */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Owner Details */}
        <div className="flex items-center gap-2.5 min-w-0">
          <UserAvatar name={ownerName} picture={ownerPicture} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {ownerName}
              </span>
              <Badge variant="emerald" className="text-[10px] py-0 px-1.5 font-semibold">
                <Crown className="w-2.5 h-2.5 mr-0.5 inline-block text-emerald-600 dark:text-emerald-400" />
                Owner
              </Badge>
            </div>
            {ownerMember?.name && ownerMember.email !== ownerName && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {ownerMember.email}
              </p>
            )}
          </div>
        </div>

        {/* Date of Creation */}
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 shrink-0">
          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span>
            Created <strong className="font-medium text-slate-700 dark:text-slate-300">{formattedDate}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
