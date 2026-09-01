import type { FamilyRelationship } from '../models/family.model';

export interface RelationshipOption {
  readonly value: FamilyRelationship;
  readonly label: string;
}

export const RELATIONSHIP_OPTIONS: readonly RelationshipOption[] = [
  { value: 'spouse', label: 'Cônjuge' },
  { value: 'child', label: 'Filho(a)' },
  { value: 'parent', label: 'Pai/Mãe' },
  { value: 'sibling', label: 'Irmão(ã)' },
  { value: 'relative', label: 'Parente' },
  { value: 'other', label: 'Outro' },
] as const;

/**
 * Returns a localized Portuguese label for a family relationship.
 */
export function getRelationshipLabel(value: FamilyRelationship): string {
  const option = RELATIONSHIP_OPTIONS.find((opt) => opt.value === value);
  return option ? option.label : value;
}
