export type MemberRole = 'OWNER' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'INACTIVE';

export interface Member {
  email: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
  addedBy: string;
  joinedAt: string;
  picture?: string;
}

export type InviteStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DriveDiscrepancyType =
  | 'MISSING_DRIVE_PERMISSION'
  | 'INACTIVE_HAS_WRITE_ACCESS'
  | 'DRIVE_USER_NOT_IN_SHEET'
  | 'READ_ONLY_ACCESS';

export interface DriveDiscrepancy {
  email: string;
  name?: string;
  type: DriveDiscrepancyType;
  permissionId?: string;
}

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
