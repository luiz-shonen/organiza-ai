import { describe, expect, it } from 'vitest';
import { formatAppVersion } from './app-version.utils';

describe('formatAppVersion', () => {
  it('shows the version, the commit and when it was deployed', () => {
    const at = '2026-11-25T23:30:00Z';
    const when = new Date(at).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(formatAppVersion({ version: '42', commit: '3777074', deployedAt: at })).toBe(
      `Versão 42 · 3777074 · ${when}`,
    );
  });

  it('leaves out what the deploy did not write', () => {
    expect(formatAppVersion({ version: 'pr-24' })).toBe('Versão pr-24');
    expect(formatAppVersion({ version: '7', deployedAt: 'ontem' })).toBe('Versão 7');
  });

  it('says local when nothing was deployed', () => {
    expect(formatAppVersion(null)).toBe('Versão local');
    expect(formatAppVersion({})).toBe('Versão local');
  });
});
