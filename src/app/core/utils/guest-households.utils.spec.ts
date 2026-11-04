import { describe, expect, it } from 'vitest';
import type { EventClaims, Guest, PartyItem } from '../models';
import { buildGuestHouseholds } from './guest-households.utils';

const items = [
  { id: 'i1', name: 'Carne', quantity: 4, unit: 'kg', claimedBy: null },
  { id: 'i2', name: 'Refrigerante', quantity: 6, unit: 'L', claimedBy: null },
  { id: 'i3', name: 'Bolo', quantity: 1, claimedBy: { uid: 'u2', name: 'Bia', phone: '' } },
] as PartyItem[];

describe('buildGuestHouseholds', () => {
  it('groups family and companions, with what each person brings', () => {
    const guests = [
      {
        id: 'u1',
        uid: 'u1',
        name: 'Jéssica',
        phone: '(31) 99267-7624',
        companions: [{ name: 'Soraya' }],
      },
      { id: 'u1_f1', name: 'Pedro', primaryGuestId: 'u1' },
      { id: 'u2', uid: 'u2', name: 'Bia', companionsCount: 2 },
    ] as Guest[];
    const claims = [
      {
        id: 'u1',
        name: 'Jéssica',
        updatedAt: '',
        entries: [
          { itemId: 'i1', memberId: null, who: 'Jéssica', quantity: 1, bought: false },
          { itemId: 'i1', memberId: 'f1', who: 'Pedro', quantity: 1, bought: false },
          { itemId: 'i2', memberId: null, who: 'Jéssica', quantity: 2, bought: false },
        ],
      },
    ] as EventClaims[];

    expect(buildGuestHouseholds(guests, items, claims)).toEqual([
      {
        id: 'u1',
        name: 'Jéssica',
        phone: '(31) 99267-7624',
        people: ['Pedro', 'Soraya'],
        bring: ['2 kg de Carne', '2 L de Refrigerante'],
        members: [
          {
            name: 'Jéssica',
            role: 'Convidado(a)',
            bring: ['1 kg de Carne', '2 L de Refrigerante'],
          },
          { name: 'Pedro', role: 'Família', bring: ['1 kg de Carne'] },
          { name: 'Soraya', role: 'Acompanhante', bring: [] },
        ],
      },
      {
        id: 'u2',
        name: 'Bia',
        phone: '',
        people: ['2 acompanhantes'],
        bring: ['1 Bolo'],
        members: [
          { name: 'Bia', role: 'Convidado(a)', bring: ['1 Bolo'] },
          { name: '2 acompanhantes', role: 'Acompanhante', bring: [] },
        ],
      },
    ]);
  });
});
