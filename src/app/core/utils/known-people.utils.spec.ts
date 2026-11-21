import { describe, it, expect } from 'vitest';
import { buildKnownPeople, matchKnownPeople, personKey } from './known-people.utils';

describe('known-people.utils', () => {
  it('reads names alike regardless of accents, case and spaces', () => {
    expect(personKey('  Jéssica   MELO ')).toBe('jessica melo');
  });

  it('keeps one entry per person, never losing a phone', () => {
    const people = buildKnownPeople([
      { name: 'Gustavo', phone: '' },
      { name: 'gustavo', phone: '(31) 99999-0000' },
      { name: 'Gustavo', phone: '(31) 99999-0000' },
      { name: 'Gustavo', phone: '' },
      { name: 'Ana', phone: '' },
      { name: 'Gustavo', phone: '(11) 98888-1111' },
      { name: '  ', phone: '(11) 90000-0000' },
    ]);
    expect(people).toEqual([
      { name: 'Ana', phone: '' },
      { name: 'gustavo', phone: '(31) 99999-0000' },
      { name: 'Gustavo', phone: '(11) 98888-1111' },
    ]);
  });

  it('one phone is one person, under the fullest name; another phone stays apart', () => {
    expect(
      buildKnownPeople([
        { name: 'Jéssica', phone: '(31) 99267-7624' },
        { name: 'Jéssica Melo', phone: '(31) 99267-7624' },
        { name: 'Jéssica Melo', phone: '(31) 99259-1290' },
        { name: 'Jéssica', phone: '' },
      ]),
    ).toEqual([
      { name: 'Jéssica Melo', phone: '(31) 99267-7624' },
      { name: 'Jéssica Melo', phone: '(31) 99259-1290' },
    ]);
  });

  it('finds people by any part of the name, up to a limit', () => {
    const people = buildKnownPeople([
      { name: 'Jéssica Melo', phone: '' },
      { name: 'Luiz Melo', phone: '' },
      { name: 'Ana', phone: '' },
    ]);
    expect(matchKnownPeople(people, 'melo').map((p) => p.name)).toEqual([
      'Jéssica Melo',
      'Luiz Melo',
    ]);
    expect(matchKnownPeople(people, 'jess')).toHaveLength(1);
    expect(matchKnownPeople(people, '')).toEqual([]);
    expect(matchKnownPeople(people, 'melo', 1)).toHaveLength(1);
  });
});
