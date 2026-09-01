import type { FamilyMember } from './family.model';

export interface GuestFormDialogResult {
  readonly name: string;
  readonly phone: string;
  readonly companionsCount: number;
  readonly selectedFamilyMembers?: FamilyMember[];
}
