import type { EventClaims, Guest, PartyItem } from '../models';
import { formatQuantity } from './item-progress.utils';

export type GuestRole = 'Convidado(a)' | 'Família' | 'Acompanhante';

/** One person going: the account holder, a relative or a companion, and what they bring. */
export interface GuestPerson {
  name: string;
  role: GuestRole;
  /** "2 kg de Carne" or "1 Bolo", one line per item. */
  bring: string[];
}

/** One confirmed household on the event page: who comes and what they bring. */
export interface GuestHousehold {
  id: string;
  name: string;
  phone: string;
  /** Companions and family members coming with the account holder. */
  people: string[];
  /** Everything the household brings, all people together. */
  bring: string[];
  /** The account holder first, then the family, then the companions. */
  members: GuestPerson[];
}

function bringLine(item: PartyItem, quantity: number): string {
  return item.unit
    ? `${formatQuantity(quantity, item.unit)} de ${item.name}`
    : `${quantity} ${item.name}`;
}

/** Adds up the quantity per item and writes one line per item. */
function linesFor(
  totals: ReadonlyMap<string, number>,
  itemsById: ReadonlyMap<string, PartyItem>,
): string[] {
  return [...totals]
    .map(([itemId, quantity]) => {
      const item = itemsById.get(itemId);
      return item ? bringLine(item, quantity) : '';
    })
    .filter(Boolean);
}

function add(totals: Map<string, number>, itemId: string, quantity: number): void {
  totals.set(itemId, (totals.get(itemId) ?? 0) + quantity);
}

/**
 * Groups the guest list by household: the account holder, the family members confirmed
 * with them (`primaryGuestId`) and their companions, and what each person claimed.
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
      const familyGuests = guests.filter((member) => member.primaryGuestId === uid);
      const entries = claims.find((claim) => claim.id === uid)?.entries ?? [];

      // memberId null is the account holder; any other id is a relative.
      const byMember = new Map<string | null, Map<string, number>>();
      const names = new Map<string | null, string>();
      for (const entry of entries) {
        if (!byMember.has(entry.memberId)) byMember.set(entry.memberId, new Map());
        add(byMember.get(entry.memberId)!, entry.itemId, entry.quantity);
        names.set(entry.memberId, entry.who);
      }
      // Claims made before households existed: the whole item, by the account holder.
      for (const item of items) {
        if (item.claimedBy?.uid === uid && !entries.some((entry) => entry.itemId === item.id)) {
          if (!byMember.has(null)) byMember.set(null, new Map());
          add(byMember.get(null)!, item.id, item.quantity);
        }
      }

      const holder: GuestPerson = {
        name: guest.name,
        role: 'Convidado(a)',
        bring: linesFor(byMember.get(null) ?? new Map(), itemsById),
      };
      const familyIds = familyGuests.map((member) => member.id.replace(`${uid}_`, ''));
      const family: GuestPerson[] = familyGuests.map((member, index) => ({
        name: member.name,
        role: 'Família',
        bring: linesFor(byMember.get(familyIds[index]) ?? new Map(), itemsById),
      }));
      // A relative who brings something but is no longer on the guest list still shows.
      for (const [memberId, totals] of byMember) {
        if (memberId !== null && !familyIds.includes(memberId)) {
          family.push({
            name: names.get(memberId) ?? 'Familiar',
            role: 'Família',
            bring: linesFor(totals, itemsById),
          });
        }
      }
      const named = guest.companions?.map((companion) => companion.name) ?? [];
      const unnamed = named.length ? 0 : (guest.companionsCount ?? 0);
      const companions: GuestPerson[] = [
        ...named,
        ...(unnamed ? [unnamed === 1 ? '1 acompanhante' : `${unnamed} acompanhantes`] : []),
      ].map((name) => ({ name, role: 'Acompanhante', bring: [] }));

      const allTotals = new Map<string, number>();
      for (const totals of byMember.values()) {
        for (const [itemId, quantity] of totals) add(allTotals, itemId, quantity);
      }

      return {
        id: guest.id,
        name: guest.name,
        phone: guest.phone ?? '',
        people: [...family, ...companions].map((person) => person.name),
        bring: linesFor(allTotals, itemsById),
        members: [holder, ...family, ...companions],
      };
    });
}
