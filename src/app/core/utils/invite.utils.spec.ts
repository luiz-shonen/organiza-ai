import { describe, expect, it } from 'vitest';
import { EVENT_CATEGORIES } from '../models';
import { inviteInitial, inviteTheme } from './invite.utils';

describe('inviteTheme', () => {
  it('picks the colours and words of the category, accents and case ignored', () => {
    expect(inviteTheme('Natal').key).toBe('natal');
    expect(inviteTheme('Ceia de Natal').className).toBe('org-invite--natal');
    expect(inviteTheme('ANIVERSÁRIO').key).toBe('aniversario');
    expect(inviteTheme('Chá de bebê').key).toBe('aniversario');
    expect(inviteTheme('Casamento').greeting).toBe('Com júbilo');
    expect(inviteTheme('Chá de panela').key).toBe('casamento');
    expect(inviteTheme('Festa Junina').key).toBe('junina');
  });

  it('says its own words for every ready-made category, and the "Outros" words for the rest', () => {
    const words = EVENT_CATEGORIES.map((category) => inviteTheme(category.name).wordsKey);
    expect(words).not.toContain('outros');
    // No two categories share the same line.
    const leads = EVENT_CATEGORIES.map((category) => inviteTheme(category.name).lead);
    expect(new Set(leads).size).toBe(leads.length);

    expect(inviteTheme('Batizado').greeting).toBe('Com fé e alegria');
    expect(inviteTheme('Batizado').key).toBe('aniversario');
    expect(inviteTheme('Aniversário da Ana').wordsKey).toBe('aniversario');
    expect(inviteTheme('Mesversário do Theo').wordsKey).toBe('mesversario');
    expect(inviteTheme('Réveillon').wordsKey).toBe('ano-novo');
    expect(inviteTheme('Noivado').key).toBe('casamento');
    expect(inviteTheme('Sarau').greeting).toBe('Prezadíssimo convidado');
    expect(inviteTheme(undefined).wordsKey).toBe('outros');
  });

  it('falls back to the app colours for anything else', () => {
    expect(inviteTheme('Churrasco').key).toBe('padrao');
    expect(inviteTheme(undefined).key).toBe('padrao');
  });

  it('puts the first letter on the seal', () => {
    expect(inviteInitial(' luiz rodrigues')).toBe('L');
    expect(inviteInitial('')).toBe('✦');
  });
});
