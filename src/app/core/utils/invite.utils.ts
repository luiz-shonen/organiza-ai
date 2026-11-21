/**
 * The look and words of an invitation, from the event's category. The words are those of a formal
 * printed invitation, a little over the top on purpose ("Rogamos a honra de vossa presença"), one
 * set for each ready-made category (`EVENT_CATEGORIES`) and for the ones people often type
 * ("Noivado", "Mesversário", "Réveillon"…). Anything else gets the "Outros" words.
 */

/** The colours: a few palettes shared by kindred parties (see `_invite-themes.scss`). */
export type InviteThemeKey = 'natal' | 'aniversario' | 'casamento' | 'junina' | 'padrao';

/** The words: one per kind of party. */
export type InviteWordsKey =
  | 'aniversario'
  | 'mesversario'
  | 'casamento'
  | 'noivado'
  | 'natal'
  | 'ano-novo'
  | 'pascoa'
  | 'junina'
  | 'churrasco'
  | 'happy-hour'
  | 'confraternizacao'
  | 'formatura'
  | 'cha-de-bebe'
  | 'cha-de-panela'
  | 'batizado'
  | 'reuniao-de-familia'
  | 'outros';

export interface InviteTheme {
  /** CSS class with the theme colours (`.org-invite--natal`, see `_invite-themes.scss`). */
  readonly className: string;
  readonly key: InviteThemeKey;
  /** Which words the invitation says; `outros` when the category is none we know. */
  readonly wordsKey: InviteWordsKey;
  /** The handwritten line at the top of the invitation. */
  readonly greeting: string;
  /** Small line before the title. */
  readonly lead: string;
  /** The motif in the middle of the flourish between the title and the date. */
  readonly ornament: string;
}

interface InviteWords {
  readonly theme: InviteThemeKey;
  readonly greeting: string;
  readonly lead: string;
  readonly ornament: string;
}

const WORDS: Record<InviteWordsKey, InviteWords> = {
  aniversario: {
    theme: 'aniversario',
    greeting: 'Celebremos!',
    lead: 'Mais uma volta ao sol requer vossa ilustre presença',
    ornament: '★',
  },
  mesversario: {
    theme: 'aniversario',
    greeting: 'Eis mais um mês!',
    lead: 'Solicitamos vossa augusta presença para festejar mais um mês de vida',
    ornament: '★',
  },
  casamento: {
    theme: 'casamento',
    greeting: 'Com júbilo',
    lead: 'temos a subida honra de convidar Vossa Senhoria para o enlace',
    ornament: '❦',
  },
  noivado: {
    theme: 'casamento',
    greeting: 'Prometidos!',
    lead: 'Comunicamos o noivado e rogamos vossa distinta presença',
    ornament: '❦',
  },
  natal: {
    theme: 'natal',
    greeting: 'Boas Festas!',
    lead: 'Rogamos a honra de vossa presença à mesa natalina',
    ornament: '✦',
  },
  'ano-novo': {
    theme: 'padrao',
    greeting: 'Feliz Ano Novo!',
    lead: 'Rogamos vossa augusta presença para saudar o ano vindouro',
    ornament: '✧',
  },
  pascoa: {
    theme: 'padrao',
    greeting: 'Feliz Páscoa!',
    lead: 'Rogamos a honra de vossa presença à solene mesa pascal',
    ornament: '❀',
  },
  junina: {
    theme: 'junina',
    greeting: 'Arraiá de gala',
    lead: 'Rogamos vossa distinta presença na quadrilha e no quentão',
    ornament: '✿',
  },
  churrasco: {
    theme: 'padrao',
    greeting: 'Às brasas!',
    lead: 'Rogamos vossa ilustre presença em torno do nobre braseiro',
    ornament: '✦',
  },
  'happy-hour': {
    theme: 'padrao',
    greeting: 'Saúde!',
    lead: 'Findo o expediente, rogamos vossa presença no brinde',
    ornament: '✧',
  },
  confraternizacao: {
    theme: 'padrao',
    greeting: 'Confraternizemos!',
    lead: 'Rogamos a honra de vossa companhia nesta solene confraria',
    ornament: '✦',
  },
  formatura: {
    theme: 'padrao',
    greeting: 'Com louvor',
    lead: 'Concluídos os estudos, rogamos vossa ilustríssima presença',
    ornament: '★',
  },
  'cha-de-bebe': {
    theme: 'aniversario',
    greeting: 'Doce espera',
    lead: 'Rogamos vossa presença para saudar quem em breve virá ao mundo',
    ornament: '✧',
  },
  'cha-de-panela': {
    theme: 'casamento',
    greeting: 'Lar, doce lar',
    lead: 'Rogamos vossa generosa presença para guarnecer o novo lar',
    ornament: '❦',
  },
  batizado: {
    theme: 'aniversario',
    greeting: 'Com fé e alegria',
    lead: 'Rogamos vossa presença no santo batismo e no ágape que se segue',
    ornament: '✧',
  },
  'reuniao-de-familia': {
    theme: 'padrao',
    greeting: 'Família reunida',
    lead: 'Rogamos a honra de vossa presença à távola da família',
    ornament: '✦',
  },
  outros: {
    theme: 'padrao',
    greeting: 'Prezadíssimo convidado',
    lead: 'Rogamos a honra de vossa presença',
    ornament: '✦',
  },
};

/**
 * The words for a category, accents and case ignored, matched by what the name holds: "Ceia de
 * Natal" is Natal, "Aniversário da Ana" is Aniversário. The more particular ones first:
 * "Chá de bebê" before "bebê", "Mesversário" before "aniversário".
 */
const MATCHES: readonly (readonly [RegExp, InviteWordsKey])[] = [
  [/cha de bebe|cha revelacao|cha de fralda/, 'cha-de-bebe'],
  [/cha de panela|cha de casa nova|cha de cozinha/, 'cha-de-panela'],
  [/mesversario/, 'mesversario'],
  [/batizado|batismo/, 'batizado'],
  [/noivado/, 'noivado'],
  [/casamento|bodas|enlace/, 'casamento'],
  [/natal|ceia/, 'natal'],
  [/ano novo|reveillon|virada/, 'ano-novo'],
  [/pascoa/, 'pascoa'],
  [/junina|julina|arraia/, 'junina'],
  [/churrasco/, 'churrasco'],
  [/happy hour/, 'happy-hour'],
  [/confraternizacao|confra\b/, 'confraternizacao'],
  [/formatura|colacao/, 'formatura'],
  [/reuniao de familia|encontro de familia/, 'reuniao-de-familia'],
  [/aniversario|niver\b/, 'aniversario'],
];

function wordsKey(category: string | null | undefined): InviteWordsKey {
  const name = (category ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return MATCHES.find(([pattern]) => pattern.test(name))?.[1] ?? 'outros';
}

export function inviteTheme(category: string | null | undefined): InviteTheme {
  const key = wordsKey(category);
  const { theme, ...words } = WORDS[key];
  return { key: theme, wordsKey: key, className: `org-invite--${theme}`, ...words };
}

/** "Luiz Rodrigues" → "L": the letter on the wax seal. */
export function inviteInitial(name: string | null | undefined): string {
  return (name ?? '').trim().charAt(0).toUpperCase() || '✦';
}
