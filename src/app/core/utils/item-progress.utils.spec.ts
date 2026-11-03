import { describe, expect, it } from 'vitest';
import type { EventClaims, PartyItem } from '../models';
import {
  addClaimEntry,
  buildFamilyChecklist,
  buildItemProgress,
  daysUntil,
  formatQuantity,
  removeClaimEntry,
  toggleBought,
  hasStarted,
} from './item-progress.utils';

const items: PartyItem[] = [
  { id: 'bolo', name: 'Bolo de milho', quantity: 10, unit: 'un.', claimedBy: null },
  { id: 'pamonha', name: 'Pamonha', quantity: 2, claimedBy: { uid: 'x', name: 'Ana', phone: '' } },
];

const claims: EventClaims[] = [
  {
    id: 'me',
    name: 'Jéssica',
    updatedAt: '',
    entries: [
      { itemId: 'bolo', memberId: null, who: 'Jéssica', quantity: 3, bought: true },
      { itemId: 'bolo', memberId: 'f1', who: 'Marta', quantity: 3, bought: false },
    ],
  },
];

describe('item progress utils', () => {
  it('sums every household share and keeps legacy single claims working', () => {
    const [bolo, pamonha] = buildItemProgress(items, claims, 'me');

    expect(bolo.claimed).toBe(6);
    expect(bolo.remaining).toBe(4);
    expect(bolo.complete).toBe(false);
    expect(bolo.shares.map((share) => share.who)).toEqual(['Você', 'Marta']);

    expect(pamonha.complete).toBe(true);
    expect(pamonha.shares).toEqual([
      { claimId: 'x', memberId: null, who: 'Ana', quantity: 2, bought: false },
    ]);
  });

  it('never counts more than the item quantity', () => {
    const [bolo] = buildItemProgress(items, [
      { ...claims[0], entries: [{ ...claims[0].entries[0], quantity: 50 }] },
    ]);
    expect(bolo.claimed).toBe(10);
    expect(bolo.remaining).toBe(0);
  });

  it('adds to the same person instead of creating a second line', () => {
    const entries = addClaimEntry(claims[0].entries, {
      itemId: 'bolo',
      memberId: 'f1',
      who: 'Marta',
      quantity: 2,
    });
    expect(entries).toHaveLength(2);
    expect(entries[1].quantity).toBe(5);

    const withNew = addClaimEntry(entries, {
      itemId: 'pamonha',
      memberId: null,
      who: 'Jéssica',
      quantity: 1,
    });
    expect(withNew[2]).toEqual({
      itemId: 'pamonha',
      memberId: null,
      who: 'Jéssica',
      quantity: 1,
      bought: false,
    });
  });

  it('toggles and removes one person line', () => {
    const toggled = toggleBought(claims[0].entries, 'bolo', 'f1');
    expect(toggled[1].bought).toBe(true);
    expect(toggled[0].bought).toBe(true);

    expect(removeClaimEntry(claims[0].entries, 'bolo', null)).toEqual([claims[0].entries[1]]);
  });

  it('builds the family checklist with "Você" for the account holder', () => {
    expect(buildFamilyChecklist(items, claims[0])).toEqual([
      {
        itemId: 'bolo',
        memberId: null,
        name: 'Bolo de milho',
        quantityLabel: '3 un.',
        who: 'Você',
        bought: true,
      },
      {
        itemId: 'bolo',
        memberId: 'f1',
        name: 'Bolo de milho',
        quantityLabel: '3 un.',
        who: 'Marta',
        bought: false,
      },
    ]);
    expect(buildFamilyChecklist(items, null)).toEqual([]);
  });

  it('formats quantities and counts days to the event', () => {
    expect(formatQuantity(6, 'L')).toBe('6 L');
    expect(formatQuantity(6)).toBe('6');
    expect(formatQuantity(1, 'panelas')).toBe('1 panela');
    expect(formatQuantity(2, 'panelas')).toBe('2 panelas');
    expect(formatQuantity(1, 'porções')).toBe('1 porção');
    expect(formatQuantity(1, 'kg')).toBe('1 kg');

    const now = new Date('2026-11-01T22:00:00');
    expect(daysUntil('2026-11-04T08:00:00', now)).toBe(3);
    expect(daysUntil('2026-11-01T23:30:00', now)).toBe(0);
    expect(daysUntil('2026-10-30T10:00:00', now)).toBe(-2);
  });
});

describe('hasStarted', () => {
  const now = new Date('2026-11-03T09:00:00');

  it('counts an event earlier today as started, though it is still today', () => {
    expect(hasStarted('2026-11-03T08:30:00', now)).toBe(true);
    expect(hasStarted('2026-11-03T20:30:00', now)).toBe(false);
    expect(hasStarted('2026-11-04T08:30:00', now)).toBe(false);
  });

  it('does not count an event without a date', () => {
    expect(hasStarted('', now)).toBe(false);
    expect(hasStarted(undefined, now)).toBe(false);
  });
});
