import type { Guest } from '../models/guest.model';

/** A confirmation waiting for the owner ("Aguardando aprovação"), with who comes along. */
export interface PendingGuest {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  /** The guest, their relatives and companions. */
  readonly people: number;
  /** The relatives' guest documents, removed with the guest when refused. */
  readonly familyGuestIds: readonly string[];
}

/**
 * Splits the guests of an event that asks for approval: the ones that count (the list, the
 * total, the amigo oculto, the items) and the ones waiting. Relatives follow their guest. Without
 * approval, or for guests saved before it was turned on, everyone counts.
 */
export function splitGuestsByApproval(
  guests: readonly Guest[],
  requireApproval: boolean,
): { approved: Guest[]; pending: PendingGuest[] } {
  if (!requireApproval) return { approved: [...guests], pending: [] };
  const waiting = new Set(guests.filter((g) => g.approved === false).map((g) => g.uid ?? g.id));
  const isWaiting = (g: Guest) =>
    g.approved === false || (!!g.primaryGuestId && waiting.has(g.primaryGuestId));
  const pending = guests
    .filter((g) => g.approved === false)
    .map((g) => {
      const family = guests.filter((m) => m.primaryGuestId && m.primaryGuestId === (g.uid ?? g.id));
      return {
        id: g.id,
        name: g.name,
        phone: g.phone ?? '',
        people: 1 + family.length + (g.companions?.length ?? g.companionsCount ?? 0),
        familyGuestIds: family.map((m) => m.id),
      };
    });
  return { approved: guests.filter((g) => !isWaiting(g)), pending };
}
