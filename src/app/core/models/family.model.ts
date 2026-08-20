export type FamilyRelationship =
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'relative'
  | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: FamilyRelationship;
  createdAt: string;
  phone?: string;
}

export type FamilyMemberCreate = Omit<FamilyMember, 'id' | 'createdAt'> & {
  createdAt?: string;
};
