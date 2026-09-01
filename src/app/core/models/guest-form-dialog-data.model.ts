import type { GuestSession } from './guest.model';
import type { FamilyMember } from './family.model';

export interface GuestFormDialogData {
  readonly session: GuestSession | null;
  readonly familyMembers?: FamilyMember[];
  readonly userId?: string;
}
