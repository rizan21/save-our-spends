export type MemberRole = 'OWNER' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'INACTIVE';

export interface Member {
  email: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
  addedBy: string;
  joinedAt: string;
}

export type InviteStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PendingInvite {
  id: string;
  invitedEmail: string;
  invitedByEmail: string;
  invitedByName: string;
  status: InviteStatus;
  requestedAt: string;
  approvedAt?: string;
}

export interface GroupConfig {
  appSignature: string;
  schemaVersion: string;
  groupId: string;
  groupName: string;
  description?: string;
  defaultCurrency: string;
  ownerEmail: string;
  createdAt: string;
}

export interface Group {
  id: string; // Google Spreadsheet ID
  name: string;
  description?: string;
  currency: string;
  ownerEmail: string;
  createdAt: string;
  members: Member[];
  pendingInvites: PendingInvite[];
  driveFileUrl?: string;
}
