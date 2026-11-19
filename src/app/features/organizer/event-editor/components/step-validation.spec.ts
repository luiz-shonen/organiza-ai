import { describe, expect, it } from 'vitest';
import { joinLabels } from './step-validation';

describe('joinLabels', () => {
  it('joins the missing fields the way people say them', () => {
    expect(joinLabels([])).toBe('');
    expect(joinLabels(['o título'])).toBe('o título');
    expect(joinLabels(['o CEP', 'o número'])).toBe('o CEP e o número');
    expect(joinLabels(['o título', 'a descrição', 'a hora'])).toBe(
      'o título, a descrição e a hora',
    );
  });
});
