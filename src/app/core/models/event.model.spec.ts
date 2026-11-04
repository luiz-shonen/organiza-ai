import { describe, expect, it } from 'vitest';
import { EVENT_CATEGORIES, getCategoryHue } from './event.model';

describe('category colours', () => {
  it('gives every ready-made category its own colour', () => {
    const hues = EVENT_CATEGORIES.map((category) => category.hue);
    expect(new Set(hues).size).toBe(hues.length);
  });

  it('keeps typed categories stable and colours a missing one grey', () => {
    expect(getCategoryHue('Festa da firma')).toBe(getCategoryHue('  festa da firma '));
    expect(getCategoryHue('Natal')).toBe(EVENT_CATEGORIES.find((c) => c.name === 'Natal')?.hue);
    expect(getCategoryHue('')).toBe('#868e96');
  });

  // Confirmado, Pendente and Recusado keep their own green, amber and red.
  it('never uses the status colours', () => {
    const status = ['#2f9e44', '#e8a200', '#c92a2a'];
    for (const { hue } of EVENT_CATEGORIES) expect(status).not.toContain(hue);
  });
});
