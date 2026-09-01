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

export * from './family-member-create.model';
export * from './relationship-option.model';
