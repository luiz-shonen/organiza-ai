/**
 * The look and words of an invitation, from the event's category. The words are those of a formal
 * printed invitation, a little over the top on purpose ("Rogamos a honra de vossa presença").
 */
export type InviteThemeKey = 'natal' | 'aniversario' | 'casamento' | 'junina' | 'padrao';

export interface InviteTheme {
  /** CSS class with the theme colours (`.org-invite--natal`, see `_invite-themes.scss`). */
  readonly className: string;
  readonly key: InviteThemeKey;
  /** The handwritten line at the top of the invitation. */
  readonly greeting: string;
  /** Small line before the title. */
  readonly lead: string;
  /** The motif in the middle of the flourish between the title and the date. */
  readonly ornament: string;
}

const THEMES: Record<InviteThemeKey, Omit<InviteTheme, 'className' | 'key'>> = {
  natal: {
    greeting: 'Boas Festas!',
    lead: 'Rogamos a honra de vossa presença à mesa natalina',
    ornament: '✦',
  },
  aniversario: {
    greeting: 'Celebremos!',
    lead: 'Mais uma volta ao sol requer vossa ilustre presença',
    ornament: '★',
  },
  casamento: {
    greeting: 'Com júbilo',
    lead: 'temos a honra de convidar Vossa Senhoria',
    ornament: '❦',
  },
  junina: {
    greeting: 'Arraiá de gala',
    lead: 'Rogamos vossa distinta presença na quadrilha e no quentão',
    ornament: '✿',
  },
  padrao: {
    greeting: 'Prezadíssimo convidado',
    lead: 'Rogamos a honra de vossa presença',
    ornament: '✦',
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
