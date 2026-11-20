/** The look and words of an invitation, from the event's category. */
export type InviteThemeKey = 'natal' | 'aniversario' | 'casamento' | 'junina' | 'padrao';

export interface InviteTheme {
  /** CSS class with the theme colours (`.org-invite--natal`, see `_invite-themes.scss`). */
  readonly className: string;
  readonly key: InviteThemeKey;
  /** The handwritten line at the top of the invitation. */
  readonly greeting: string;
  /** Small line before the title. */
  readonly lead: string;
  /** Between the title and the date. */
  readonly ornament: string;
}

const THEMES: Record<InviteThemeKey, Omit<InviteTheme, 'className' | 'key'>> = {
  natal: { greeting: 'Feliz Natal!', lead: 'Venha celebrar com a gente', ornament: '✦ ✦ ✦' },
  aniversario: {
    greeting: 'Vem comemorar!',
    lead: 'Sua presença é o melhor presente',
    ornament: '• ★ •',
  },
  casamento: {
    greeting: 'Com muita alegria',
    lead: 'convidamos você para celebrar',
    ornament: '— ❦ —',
  },
  junina: {
    greeting: 'Bora pro arraiá!',
    lead: 'Tem quentão, quadrilha e você',
    ornament: '✿ ✿ ✿',
  },
  padrao: {
    greeting: 'Um convite para você',
    lead: 'Venha celebrar com a gente',
    ornament: '✦ ✦ ✦',
  },
};

function themeKey(category: string | null | undefined): InviteThemeKey {
  const name = (category ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  if (name.includes('natal') || name.includes('ceia')) return 'natal';
  if (/casamento|noivado|bodas|cha de panela/.test(name)) return 'casamento';
  if (/aniversario|cha de bebe|batizado|mesversario/.test(name)) return 'aniversario';
  if (/junina|julina|arraia/.test(name)) return 'junina';
  return 'padrao';
}

export function inviteTheme(category: string | null | undefined): InviteTheme {
  const key = themeKey(category);
  return { key, className: `org-invite--${key}`, ...THEMES[key] };
}

/** "Luiz Rodrigues" → "L": the letter on the wax seal. */
export function inviteInitial(name: string | null | undefined): string {
  return (name ?? '').trim().charAt(0).toUpperCase() || '✦';
}
