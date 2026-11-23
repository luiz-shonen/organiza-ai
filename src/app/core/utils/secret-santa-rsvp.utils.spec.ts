import { describe, expect, it } from 'vitest';
import type { SecretSantaParticipant } from '../models';
import {
  buildRsvpSecretSantaEntries,
  findSecretSantaDuplicates,
  isSecretSantaOpen,
  isSecretSantaSelfJoinOpen,
  normalizePersonName,
  rsvpSecretSantaEntryId,
  secretSantaRsvpId,
} from './secret-santa.utils';

const person = (
  id: string,
  name: string,
  phone: string,
  extra: Partial<SecretSantaParticipant> = {},
): SecretSantaParticipant => ({ id, name, phone, giftOptions: [], ...extra });

describe('normalizePersonName', () => {
  it('ignores accents, case and extra spaces', () => {
    expect(normalizePersonName('  Jéssica   MELO ')).toBe('jessica melo');
  });
});

describe('secretSantaRsvpId', () => {
  it('gives each person a guest puts in the draw a fixed id under their account', () => {
    expect(secretSantaRsvpId('u1')).toBe('rsvp_u1');
    expect(secretSantaRsvpId('u1', { familyId: 'fam-9' })).toBe('rsvp_u1_f_fam-9');
    expect(secretSantaRsvpId('u1', { companion: 'Dona Ana Júlia' })).toBe(
      'rsvp_u1_c_dona-ana-julia',
    );
    expect(rsvpSecretSantaEntryId('u1', 'c:Dona Ana Júlia')).toBe('rsvp_u1_c_dona-ana-julia');
    expect(rsvpSecretSantaEntryId('u1', 'self')).toBe('rsvp_u1');
  });
});

describe('findSecretSantaDuplicates', () => {
  const joined = (id: string, name: string, phone: string, extra = {}) =>
    person(id, name, phone, { joinedBy: 'u1', ...extra });

  it('is sure with the same phone and first name, whatever the rest of the name', () => {
    const typed = person('m1', 'Jessica', '(11) 98888-1111', { giftOptions: ['Livro'] });
    const self = joined('rsvp_u1', 'Jéssica Melo', '11988881111');
    expect(findSecretSantaDuplicates([typed, self])).toEqual([
      { keep: self, drop: typed, sure: true },
    ]);
  });

  it('is sure with the same confirmed guest', () => {
    const typed = person('m1', 'Ju', '', { guestId: 'u1' });
    const self = joined('rsvp_u1', 'Juliana', '11988881111', { guestId: 'u1' });
    expect(findSecretSantaDuplicates([typed, self])).toEqual([
      { keep: self, drop: typed, sure: true },
    ]);
  });

  it('keeps a grandmother and her daughter apart: same phone, other names', () => {
    const grandma = person('m1', 'Dona Ana', '(11) 98888-1111');
    const daughter = joined('rsvp_u1', 'Maria', '(11) 98888-1111');
    expect(findSecretSantaDuplicates([grandma, daughter])).toEqual([]);
  });

  it('only points out the same full name with another phone, until told they differ', () => {
    const typed = person('m1', 'Ana Souza', '(11) 97777-0000');
    const self = joined('rsvp_u1', 'Ana Souza', '(11) 98888-1111');
    expect(findSecretSantaDuplicates([typed, self])).toEqual([
      { keep: self, drop: typed, sure: false },
    ]);
    expect(findSecretSantaDuplicates([typed, { ...self, distinctFrom: ['m1'] }])).toEqual([]);
  });

  it('never pairs two people the organizer typed', () => {
    expect(
      findSecretSantaDuplicates([
        person('m1', 'Ana', '(11) 98888-1111'),
        person('m2', 'Ana', '(11) 98888-1111'),
      ]),
    ).toEqual([]);
  });
});

describe('buildRsvpSecretSantaEntries', () => {
  it('sends the links of relatives without a phone to the guest', () => {
    const entries = buildRsvpSecretSantaEntries({
      uid: 'u1',
      name: 'Maria',
      phone: '(11) 98888-1111',
      familyMembers: [
        { id: 'ana', name: 'Dona Ana', phone: '' },
        { id: 'leo', name: 'Leo', phone: '11977776666' },
      ],
      companions: ['Bia'],
      choice: { self: ['Livro'], 'f:ana': ['Manta'], 'f:leo': [], 'c:Bia': [] },
    });
    expect(entries).toEqual([
      {
        id: 'rsvp_u1',
        input: { name: 'Maria', phone: '(11) 98888-1111', giftOptions: ['Livro'], guestId: 'u1' },
      },
      {
        id: 'rsvp_u1_f_ana',
        input: {
          name: 'Dona Ana',
          phone: '(11) 98888-1111',
          giftOptions: ['Manta'],
          guestId: 'u1_ana',
        },
      },
      {
        id: 'rsvp_u1_f_leo',
        input: { name: 'Leo', phone: '(11) 97777-6666', giftOptions: [], guestId: 'u1_leo' },
      },
      {
        id: 'rsvp_u1_c_bia',
        input: { name: 'Bia', phone: '(11) 98888-1111', giftOptions: [], guestId: 'u1#0' },
      },
    ]);
  });

  it('leaves out someone no longer going', () => {
    const entries = buildRsvpSecretSantaEntries({
      uid: 'u1',
      name: 'Maria',
      phone: '(11) 98888-1111',
      familyMembers: [],
      companions: [],
      choice: { 'f:gone': [], 'c:Gone': [] },
    });
    expect(entries).toEqual([]);
  });
});

describe('isSecretSantaSelfJoinOpen', () => {
  it('is open unless the owner closed it', () => {
    expect(isSecretSantaSelfJoinOpen({ enabled: true })).toBe(true);
    expect(isSecretSantaSelfJoinOpen({ enabled: true, selfJoin: false })).toBe(false);
    expect(isSecretSantaSelfJoinOpen({ enabled: false })).toBe(false);
    expect(isSecretSantaSelfJoinOpen(null)).toBe(false);
  });

  it('closes, for joining and leaving, once drawn or when the draw day starts in Brasília', () => {
    const settings = { enabled: true, drawDate: '2026-12-20' };
    expect(isSecretSantaOpen(settings, new Date('2026-12-20T02:59:00Z'))).toBe(true);
    expect(isSecretSantaOpen(settings, new Date('2026-12-20T03:00:00Z'))).toBe(false);
    expect(isSecretSantaOpen({ enabled: true, drawnAt: '2026-12-01T10:00:00Z' })).toBe(false);
    // Closing the sign-ups stops joining, not leaving.
    expect(isSecretSantaOpen({ enabled: true, selfJoin: false })).toBe(true);
    expect(isSecretSantaSelfJoinOpen({ enabled: true, selfJoin: false })).toBe(false);
  });
});

describe('buildRsvpSecretSantaEntries: whose WhatsApp each link goes to', () => {
  const build = (phones?: Record<string, string>) =>
    buildRsvpSecretSantaEntries({
      uid: 'u1',
      name: 'Maria',
      phone: '(11) 99999-8888',
      familyMembers: [
        { id: 'ana', name: 'Ana', phone: '(11) 97777-1111' },
        { id: 'vo', name: 'Vó Lurdes' },
      ],
      companions: ['Romero'],
      choice: { self: [], 'f:ana': [], 'f:vo': [], 'c:Romero': [] },
      phones,
    }).map((entry) => [entry.input.name, entry.input.phone]);

  it('uses the number typed in the invite first, then the family profile, then the guest', () => {
    expect(build({ 'f:vo': '11966665555', 'c:Romero': '(21) 98888-0000' })).toEqual([
      ['Maria', '(11) 99999-8888'],
      ['Ana', '(11) 97777-1111'],
      ['Vó Lurdes', '(11) 96666-5555'],
      ['Romero', '(21) 98888-0000'],
    ]);
  });

  it('sends the link to the guest when nobody typed a number', () => {
    expect(build()).toEqual([
      ['Maria', '(11) 99999-8888'],
      ['Ana', '(11) 97777-1111'],
      ['Vó Lurdes', '(11) 99999-8888'],
      ['Romero', '(11) 99999-8888'],
    ]);
  });
});
