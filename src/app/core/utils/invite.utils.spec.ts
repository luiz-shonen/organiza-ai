import { describe, expect, it } from 'vitest';
import { inviteInitial, inviteTheme } from './invite.utils';

describe('inviteTheme', () => {
  it('picks the colours and words of the category, accents and case ignored', () => {
    expect(inviteTheme('Natal').key).toBe('natal');
    expect(inviteTheme('Ceia de Natal').className).toBe('org-invite--natal');
    expect(inviteTheme('ANIVERSÁRIO').key).toBe('aniversario');
    expect(inviteTheme('Chá de bebê').key).toBe('aniversario');
    expect(inviteTheme('Casamento').greeting).toBe('Com muita alegria');
    expect(inviteTheme('Chá de panela').key).toBe('casamento');
    expect(inviteTheme('Festa Junina').key).toBe('junina');
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
