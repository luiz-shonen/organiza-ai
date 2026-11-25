/** `pet`: an animal of the family. It goes to events but is not counted as a person. */
export type FamilyRelationship =
  | 'spouse'
  | 'child'
  | 'parent'
  | 'grandparent'
  | 'sibling'
  | 'relative'
  | 'pet'
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
