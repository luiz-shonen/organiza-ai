import type {
  EventClaims,
  FamilyChecklistRow,
  ItemClaimEntry,
  ItemClaimRequest,
  ItemProgress,
  ItemShare,
  PartyItem,
} from '../models';

/**
 * Joins items with every household's claims. A legacy `claimedBy` counts as one
 * share of the whole quantity, so events created before claims keep working.
 */
export function buildItemProgress(
  items: readonly PartyItem[],
  claims: readonly EventClaims[],
  /** The viewer's uid: their own line reads "Você". */
  selfId: string | null = null,
): ItemProgress[] {
  return items.map((item) => {
    const shares: ItemShare[] = [];
    if (item.claimedBy) {
      shares.push({
        claimId: item.claimedBy.uid,
        memberId: null,
        who: item.claimedBy.name,
        quantity: item.quantity,
        bought: false,
      });
    }
    for (const household of claims) {
      for (const entry of household.entries) {
        if (entry.itemId === item.id && entry.quantity > 0) {
          shares.push({
            claimId: household.id,
            memberId: entry.memberId,
            who: household.id === selfId && !entry.memberId ? 'Você' : entry.who,
            quantity: entry.quantity,
            bought: entry.bought,
          });
        }
      }
    }
    const claimed = Math.min(
      item.quantity,
      shares.reduce((sum, share) => sum + share.quantity, 0),
    );
    return {
      item,
      shares,
      claimed,
      remaining: item.quantity - claimed,
      complete: claimed >= item.quantity,
    };
  });
}

// Units are picked in the plural ("5 panelas"); one of them reads in the singular.
const SINGULAR_UNITS: Readonly<Record<string, string>> = {
  dúzias: 'dúzia',
  pacotes: 'pacote',
  garrafas: 'garrafa',
  latas: 'lata',
  caixas: 'caixa',
  fardos: 'fardo',
  sacos: 'saco',
  potes: 'pote',
  panelas: 'panela',
  travessas: 'travessa',
  bandejas: 'bandeja',
  porções: 'porção',
  fatias: 'fatia',
};

/** The unit as it reads next to `quantity`: "1 panela", "2 panelas". */
export function unitFor(quantity: number, unit?: string | null): string {
  if (!unit) return '';
  return quantity === 1 ? (SINGULAR_UNITS[unit] ?? unit) : unit;
}

/** "10 un.", "6 L", "1 panela" or just "10" when the item has no unit. */
export function formatQuantity(quantity: number, unit?: string | null): string {
  const label = unitFor(quantity, unit);
  return label ? `${quantity} ${label}` : `${quantity}`;
}

/**
 * The event's start time has passed: from then on it is "Realizado", not upcoming. An event
 * today at 8:30 is past at 8:31, even though daysUntil still says 0.
 */
export function hasStarted(dateStr: string | null | undefined, now = new Date()): boolean {
  const start = new Date(dateStr ?? '').getTime();
  return Number.isFinite(start) && start <= now.getTime();
}

/** Whole days from today until the date (negative when it has passed). */
export function daysUntil(dateStr: string, now = new Date()): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Adds a claim to the household's entries. The same person picking the same item
 * again adds to what they already bring instead of creating a second line.
 */
export function addClaimEntry(
  entries: readonly ItemClaimEntry[],
  request: ItemClaimRequest,
): ItemClaimEntry[] {
  const existing = entries.find(
    (entry) => entry.itemId === request.itemId && entry.memberId === request.memberId,
  );
  if (existing) {
    return entries.map((entry) =>
      entry === existing ? { ...entry, quantity: entry.quantity + request.quantity } : entry,
    );
  }
  return [...entries, { ...request, bought: false }];
}

/** Flips the "comprado" check of one person's line. */
export function toggleBought(
  entries: readonly ItemClaimEntry[],
  itemId: string,
  memberId: string | null,
): ItemClaimEntry[] {
  return entries.map((entry) =>
    entry.itemId === itemId && entry.memberId === memberId
      ? { ...entry, bought: !entry.bought }
      : entry,
  );
}

/** Removes one person's line for an item. */
export function removeClaimEntry(
  entries: readonly ItemClaimEntry[],
  itemId: string,
  memberId: string | null,
): ItemClaimEntry[] {
  return entries.filter((entry) => !(entry.itemId === itemId && entry.memberId === memberId));
}

/**
 * The household's lines joined with the item names, for the family checklist.
 * The account holder shows as "Você".
 */
export function buildFamilyChecklist(
  items: readonly PartyItem[],
  claims: EventClaims | null,
): FamilyChecklistRow[] {
  if (!claims) return [];
  const byId = new Map(items.map((item) => [item.id, item]));
  return claims.entries.flatMap((entry) => {
    const item = byId.get(entry.itemId);
    if (!item) return [];
    return [
      {
        itemId: entry.itemId,
        memberId: entry.memberId,
        name: item.name,
        quantityLabel: formatQuantity(entry.quantity, item.unit),
        who: entry.memberId ? entry.who : 'Você',
        bought: entry.bought,
      },
    ];
  });
}
