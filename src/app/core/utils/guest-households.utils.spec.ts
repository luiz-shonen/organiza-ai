import { describe, expect, it } from 'vitest';
import type { EventClaims, Guest, PartyItem } from '../models';
import { buildGuestHouseholds, countGuests, householdPeople } from './guest-households.utils';

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
          { name: 'Pedro', role: 'Família', guestId: 'u1_f1', bring: ['1 kg de Carne'] },
          { name: 'Soraya', role: 'Acompanhante', kinship: 'Acompanhante', bring: [] },
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
          { name: '2 acompanhantes', role: 'Acompanhante', kinship: 'Acompanhante', bring: [] },
        ],
      },
    ]);
  });
});

describe('kinship and pets', () => {
  const guests = [
    { id: 'u1', uid: 'u1', name: 'Luiz', companions: [{ name: 'Soraya' }] },
    { id: 'u1_f1', name: 'Shiba', primaryGuestId: 'u1', relationship: 'pet' },
    { id: 'u1_f2', name: 'Ana', primaryGuestId: 'u1', relationship: 'child' },
    { id: 'u1_f3', name: 'Rui', primaryGuestId: 'u1' },
  ] as Guest[];

  it('marks family and companions, with the kinship of each relative when it was saved', () => {
    const [household] = buildGuestHouseholds(guests, [], []);
    expect(household.members.map((member) => [member.role, member.kinship])).toEqual([
      ['Convidado(a)', undefined],
      ['Família', 'Filho(a)'],
      ['Família', 'Pet'],
      ['Família', undefined],
      ['Acompanhante', 'Acompanhante'],
    ]);
    expect(household.pets).toBe(1);
    expect(householdPeople(household)).toBe(4);
  });

  it('counts pets apart from people', () => {
    expect(countGuests(guests)).toEqual({ people: 4, pets: 1 });
  });

  it('lists relatives in kinship order, companions last', () => {
    const mixed = [
      { id: 'u1', uid: 'u1', name: 'Luiz', companions: [{ name: 'Benjamin' }] },
      { id: 'u1_a', name: 'Rex', primaryGuestId: 'u1', relationship: 'pet' },
      { id: 'u1_b', name: 'Vó Maria', primaryGuestId: 'u1', relationship: 'grandparent' },
      { id: 'u1_c', name: 'Tio', primaryGuestId: 'u1', relationship: 'other' },
      { id: 'u1_d', name: 'Jéssica', primaryGuestId: 'u1', relationship: 'spouse' },
      { id: 'u1_e', name: 'Ana', primaryGuestId: 'u1', relationship: 'child' },
    ] as Guest[];
    const [household] = buildGuestHouseholds(mixed, [], []);
    expect(household.members.map((member) => member.name)).toEqual([
      'Luiz',
      'Jéssica',
      'Ana',
      'Vó Maria',
      'Rex',
      'Tio',
      'Benjamin',
    ]);
  });
});

describe('guests added by hand', () => {
  it('are a household of their own, marked as added by hand, and counted with companions', () => {
    const guests = [
      { id: 'u1', uid: 'u1', name: 'Jéssica' },
      {
        id: 'm1',
        name: 'Tia Cida',
        phone: '',
        addedBy: 'u1',
        companions: [{ name: 'Seu Zé' }],
        companionsCount: 1,
      },
    ] as Guest[];

    const [jessica, cida] = buildGuestHouseholds(guests, [], []);
    expect(jessica.manual).toBeUndefined();
    expect(cida.manual).toBe(true);
    expect(cida.members.map((person) => person.name)).toEqual(['Tia Cida', 'Seu Zé']);
    expect(householdPeople(cida)).toBe(2);
    expect(countGuests(guests).people).toBe(3);
  });
});
