import type { FamilyRelationship } from './family.model';

export interface GuestCompanion {
  name: string;
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  isConfirmed: boolean;
  confirmedAt: string;
  primaryGuestId?: string;
  /** A relative's kinship to the guest who confirmed them ("Filho(a)", "Pet"). */
  relationship?: FamilyRelationship;
  uid?: string;
  /**
   * False while an event that asks for approval waits for the owner ("Aguardando aprovação").
   * Only on the guest's own document; relatives follow it. Missing means approved.
   */
  approved?: boolean;
  companions?: GuestCompanion[];
  companionsCount?: number;
  createdAt?: string;
  /**
   * Put on the list by an organizer ("Adicionar alguém à mão"): the uid of who added them. Such a
   * guest has no account (`uid`), never answers the invite and is edited only by the organizers.
   */
  addedBy?: string;
}

/**
 * A relative of someone added by hand. They have no family profile (no account behind them), so
 * they live only on this event, as guest entries tied to the hand-added person (`primaryGuestId`).
 */
export interface ManualGuestRelative {
  /** The guest entry's id; missing for one added in this form. */
  id?: string;
  name: string;
  relationship: FamilyRelationship;
  /** Formatted WhatsApp, or '' when not given. */
  phone: string;
}

/** One person the organizer puts in the amigo oculto while adding someone by hand. */
export interface ManualGuestSantaEntry {
  name: string;
  /** Formatted WhatsApp, or '' when not given. */
  phone: string;
  giftOptions: string[];
}

/** What the organizer types in "Adicionar alguém à mão": the person and who comes with them. */
export interface ManualGuestInput {
  name: string;
  /** Formatted WhatsApp, or '' when not given. */
  phone: string;
  /** Companions' names, at most `MAX_COMPANIONS`. */
  companions: string[];
  /** Relatives going with them, kept only on this event. */
  relatives: ManualGuestRelative[];
  /** Who goes into the amigo oculto; asked only when adding, not when editing. */
  secretSanta?: ManualGuestSantaEntry[];
}

export type GuestCreate = Omit<
  Guest,
  'id' | 'createdAt' | 'uid' | 'isConfirmed' | 'confirmedAt'
> & {
  isConfirmed?: boolean;
  confirmedAt?: string;
};

export interface GuestSession {
  name: string;
  phone: string;
}

/** "Não poderei ir": who declined, with an optional message the organizer reads. */
export interface GuestDecline {
  id: string;
  name: string;
  message: string;
  declinedAt: string;
}
