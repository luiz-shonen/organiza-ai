import type { FamilyRelationship } from './family.model';

export interface RelationshipOption {
  readonly value: FamilyRelationship;
  readonly label: string;
}
