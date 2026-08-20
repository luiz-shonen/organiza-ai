import type { GuestSession } from './guest.model';
import type { FamilyMember } from './family.model';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface GuestFormDialogData {
  session: GuestSession | null;
  familyMembers?: FamilyMember[];
  userId?: string;
}

export interface GuestFormDialogResult {
  name: string;
  phone: string;
  companionsCount: number;
  selectedFamilyMembers?: FamilyMember[];
}

export interface BatchPrimaryGuestInput {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  companionsCount?: number;
}
