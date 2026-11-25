import { describe, expect, it } from 'vitest';
import { parseSuggestion, parseInput, peopleBucket, suggestionKey } from '../src/suggestion';

// The same cases as src/app/core/utils/ai-suggestion.utils.spec.ts: the app reads the cache
// with the key the Worker writes, so both must agree.
const KEY_CASES = [
  [{ category: 'Churrasco', people: 18, items: [] }, 'churrasco_20p_vazio'],
  [
    { category: 'Churrasco', people: 20, items: ['Carvão', 'Pão de alho'] },
    'churrasco_20p_d99ebc22',
  ],
  [
    { category: 'Churrasco', people: 20, items: ['pao de ALHO', 'carvao', 'Carvão'] },
    'churrasco_20p_d99ebc22',
  ],
  [{ category: 'Festa Junina', people: 3, items: ['Pipoca'] }, 'festa-junina_5p_f3b5c6fb'],
] as const;

describe('suggestionKey', () => {
  it.each(KEY_CASES)('%o → %s', (input, key) => {
    expect(suggestionKey(input)).toBe(key);
  });

  it('ignores case, accents, repeats and order of the names on the list', () => {
    expect(
      suggestionKey({ category: 'Churrasco', people: 20, items: ['Carvão', 'Pão de alho'] }),
    ).toBe(
      suggestionKey({
        category: 'churrasco',
        people: 17,
        items: ['pao de ALHO', 'carvao', 'Carvão'],
      }),
    );
  });

  it('rounds people up to 5, between 5 and 999', () => {
    expect([1, 5, 6, 20, 21, 1000].map(peopleBucket)).toEqual([5, 5, 10, 20, 25, 999]);
  });
});

describe('parseInput', () => {
  it('takes a category, people and item names', () => {
    expect(parseInput({ category: ' Natal ', people: 12, items: ['Peru'] })).toEqual({
      category: 'Natal',
      people: 12,
      items: ['Peru'],
    });
  });

  it.each([
    null,
    { category: '', people: 10, items: [] },
    { category: 'Natal', people: 0, items: [] },
    { category: 'Natal', people: 1.5, items: [] },
    { category: 'Natal', people: 10, items: [3] },
    { category: 'Natal', people: 10, items: 'Peru' },
  ])('refuses %o', (value) => {
    expect(parseInput(value)).toBeNull();
  });
});

describe('parseSuggestion', () => {
  const input = { category: 'Churrasco', people: 20, items: ['Carvão'] };

  it('keeps allowed units, whole quantities and drops what is already on the list', () => {
    const text = JSON.stringify({
      items: [
        { name: 'Carvao', quantity: 3, unit: 'sacos', reason: 'já existe' },
        { name: 'Picanha', quantity: 7.6, unit: 'kg', reason: 'carne principal' },
        { name: 'Gelo <b>', quantity: 0, unit: 'toneladas', reason: '' },
        { name: 'picanha', quantity: 2, unit: 'kg', reason: 'repetido' },
      ],
      tip: 'Compre o gelo no dia.',
    });
    expect(parseSuggestion(text, input)).toEqual({
      items: [
        { name: 'Picanha', quantity: 8, unit: 'kg', reason: 'carne principal' },
        { name: 'Gelo b', quantity: 1, unit: 'un.', reason: '' },
      ],
      tip: 'Compre o gelo no dia.',
    });
  });

  it('reads JSON wrapped in a code fence', () => {
    const text = '```json\n{"items":[{"name":"Farofa","quantity":2,"unit":"potes"}]}\n```';
    expect(parseSuggestion(text, input).items).toEqual([
      { name: 'Farofa', quantity: 2, unit: 'potes', reason: '' },
    ]);
  });

  it('throws on an answer that is not the JSON asked for', () => {
    expect(() => parseSuggestion('Claro! Aqui vai:', input)).toThrow();
    expect(() => parseSuggestion('{"itens":[]}', input)).toThrow();
  });
});
