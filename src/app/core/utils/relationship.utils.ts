import type { FamilyRelationship } from '../models/family.model';
import type { RelationshipOption } from '../models/relationship-option.model';

export type { RelationshipOption };

/**
 * Every kinship, in the order relatives are always listed: cônjuge, filhos, pai/mãe, avô/avó,
 * irmão, parente, pet, outro (companions come after all of them).
 */
export const RELATIONSHIP_OPTIONS: readonly RelationshipOption[] = [
  { value: 'spouse', label: 'Cônjuge' },
  { value: 'child', label: 'Filho(a)' },
  { value: 'parent', label: 'Pai/Mãe' },
  { value: 'grandparent', label: 'Avô/Avó' },
  { value: 'sibling', label: 'Irmão(ã)' },
  { value: 'relative', label: 'Parente' },
  { value: 'pet', label: 'Pet' },
  { value: 'other', label: 'Outro' },
] as const;

/** Where a kinship comes in that order; an unknown one goes just before companions. */
export function relationshipRank(relationship: FamilyRelationship | null | undefined): number {
  const index = RELATIONSHIP_OPTIONS.findIndex((option) => option.value === relationship);
  return index < 0 ? RELATIONSHIP_OPTIONS.length : index;
}

/** Relatives in kinship order; the same kinship keeps the order it came in (stable). */
export function sortByKinship<T extends { relationship?: FamilyRelationship | null }>(
  members: readonly T[],
): T[] {
  return [...members].sort(
    (a, b) => relationshipRank(a.relationship) - relationshipRank(b.relationship),
  );
}

/** A pet goes to events but is no person: no phone, no amigo oculto, counted apart. */
export function isPet(relationship: FamilyRelationship | null | undefined): boolean {
  return relationship === 'pet';
}

/** "1 pet" or "2 pets". */
export function petsLabel(count: number): string {
  return count === 1 ? '1 pet' : `${count} pets`;
}

/**
 * Returns a localized Portuguese label for a family relationship.
 */
export function getRelationshipLabel(value: FamilyRelationship): string {
  const option = RELATIONSHIP_OPTIONS.find((opt) => opt.value === value);
  return option ? option.label : value;
}
