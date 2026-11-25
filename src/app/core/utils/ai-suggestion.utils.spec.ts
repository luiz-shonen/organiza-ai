import { describe, expect, it } from 'vitest';
import {
  aiSuggestionThreshold,
  isAiSuggestionDue,
  suggestionKey,
  toAiSuggestion,
} from './ai-suggestion.utils';

// The same cases as ai-worker/test/suggestion.test.ts: the Worker writes the cache under this
// key and the app reads it, so both must agree.
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
});

describe('isAiSuggestionDue', () => {
  it('shows once 70% of the expected people confirmed, rounded up', () => {
    expect(aiSuggestionThreshold(20)).toBe(14);
    expect(aiSuggestionThreshold(7)).toBe(5);
    expect(isAiSuggestionDue(20, 13)).toBe(false);
    expect(isAiSuggestionDue(20, 14)).toBe(true);
  });

  it('never shows without an expected number', () => {
    expect(isAiSuggestionDue(null, 50)).toBe(false);
    expect(isAiSuggestionDue(undefined, 50)).toBe(false);
  });
});

describe('toAiSuggestion', () => {
  it('keeps only complete items from the shared cache', () => {
    expect(
      toAiSuggestion({
        items: [
          { name: 'Carvão', quantity: 3, unit: 'sacos', reason: 'para a churrasqueira' },
          { name: '', quantity: 1, unit: 'un.' },
          { name: 'Gelo', quantity: 0, unit: 'sacos' },
          { name: 'Farofa', quantity: 2, unit: 'potes' },
        ],
        tip: 'Gelo no dia.',
      }),
    ).toEqual({
      items: [
        { name: 'Carvão', quantity: 3, unit: 'sacos', reason: 'para a churrasqueira' },
        { name: 'Farofa', quantity: 2, unit: 'potes', reason: '' },
      ],
      tip: 'Gelo no dia.',
    });
    expect(toAiSuggestion(null)).toBeNull();
    expect(toAiSuggestion({ tip: 'sem itens' })).toBeNull();
  });
});
