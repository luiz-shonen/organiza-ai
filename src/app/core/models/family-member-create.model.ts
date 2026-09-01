import type { FamilyMember } from './family.model';

export type FamilyMemberCreate = Omit<FamilyMember, 'id' | 'createdAt'> & {
  readonly createdAt?: string;
};
