/** One person of a household bringing part of an item. */
export interface ItemClaimEntry {
  itemId: string;
  /** Family member id, or `null` for the account holder. */
  memberId: string | null;
  who: string;
  quantity: number;
  bought: boolean;
}

/** A household's commitments for one event, stored at `events/{eventId}/claims/{uid}`. */
export interface EventClaims {
  /** The account holder's uid. */
  id: string;
  name: string;
  entries: ItemClaimEntry[];
  updatedAt: string;
}

/** One slice of an item's quantity, as shown in the event list and progress bars. */
export interface ItemShare {
  claimId: string;
  memberId: string | null;
  who: string;
  quantity: number;
  bought: boolean;
}

/** An item with everything the screens derive from its claims. */
export interface ItemProgress {
  item: { id: string; name: string; quantity: number; unit?: string; fixedQuantity?: boolean };
  shares: ItemShare[];
  claimed: number;
  remaining: number;
  complete: boolean;
}

/** What the "Eu levo" sheet returns. */
export interface ItemClaimRequest {
  itemId: string;
  quantity: number;
  memberId: string | null;
  who: string;
}

/** One line of the family checklist: what one person of the household brings. */
export interface FamilyChecklistRow {
  itemId: string;
  memberId: string | null;
  name: string;
  quantityLabel: string;
  who: string;
  bought: boolean;
}
