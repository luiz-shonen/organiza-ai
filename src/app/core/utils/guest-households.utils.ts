import type { EventClaims, Guest, PartyItem } from '../models';
import { formatQuantity } from './item-progress.utils';

/** One confirmed household on the event page: who comes and what they bring. */
export interface GuestHousehold {
  id: string;
  name: string;
  phone: string;
  /** Companions and family members coming with the account holder. */
  people: string[];
  /** "2 kg de Carne" or "1 Bolo", one line per item. */
  bring: string[];
}

/**
 * Groups the guest list by household: the account holder, the family members confirmed
 * with them (`primaryGuestId`) and their companions, plus what the household claimed.
 */
export function buildGuestHouseholds(
  guests: readonly Guest[],
  items: readonly PartyItem[],
  claims: readonly EventClaims[],
): GuestHousehold[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return guests
    .filter((guest) => !guest.primaryGuestId)
    .map((guest) => {
      const uid = guest.uid || guest.id;
      const family = guests
        .filter((member) => member.primaryGuestId === uid)
        .map((member) => member.name);
      const companions = guest.companions?.map((companion) => companion.name) ?? [];
      const unnamed = companions.length ? 0 : (guest.companionsCount ?? 0);
      const people = [
        ...family,
        ...companions,
        ...(unnamed ? [unnamed === 1 ? '1 acompanhante' : `${unnamed} acompanhantes`] : []),
      ];

      const totals = new Map<string, number>();
      for (const entry of claims.find((claim) => claim.id === uid)?.entries ?? []) {
        totals.set(entry.itemId, (totals.get(entry.itemId) ?? 0) + entry.quantity);
      }
      for (const item of items) {
        if (item.claimedBy?.uid === uid && !totals.has(item.id)) totals.set(item.id, item.quantity);
      }
      const bring = [...totals]
        .map(([itemId, quantity]) => {
          const item = itemsById.get(itemId);
          if (!item) return '';
          return item.unit
            ? `${formatQuantity(quantity, item.unit)} de ${item.name}`
            : `${quantity} ${item.name}`;
        })
        .filter(Boolean);

      return { id: guest.id, name: guest.name, phone: guest.phone ?? '', people, bring };
    });
}
