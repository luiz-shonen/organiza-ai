import { describe, expect, it } from 'vitest';
import { sortByName } from './sort.utils';

describe('sortByName', () => {
  it('orders names as Brazilians read them, accents and capitals aside', () => {
    const people = [{ name: 'vó Maria' }, { name: 'Álvaro' }, { name: 'Bia' }, { name: 'Alice' }];
    expect(sortByName(people).map((p) => p.name)).toEqual(['Alice', 'Álvaro', 'Bia', 'vó Maria']);
    expect(people[0].name).toBe('vó Maria');
  });
});
