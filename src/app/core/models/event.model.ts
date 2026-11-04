export interface AddressDetails {
  cep?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
}

export type PixType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | string;

export interface EventCategoryOption {
  readonly name: string;
  readonly class: string;
  /**
   * The tag colour, one per category, spread around the colour wheel. Never the exact green,
   * amber or red of Confirmado, Pendente and Recusado (#2f9e44, #e8a200, #c92a2a).
   */
  readonly hue: string;
}

/** Ready-made categories; the editor also lets people type their own. */
export const EVENT_CATEGORIES: readonly EventCategoryOption[] = [
  { name: 'Aniversário', class: 'cat-aniversario', hue: '#ae3ec9' },
  { name: 'Casamento', class: 'cat-casamento', hue: '#f06595' },
  { name: 'Natal', class: 'cat-festa', hue: '#0ca678' },
  { name: 'Ano Novo', class: 'cat-festa', hue: '#3b5bdb' },
  { name: 'Páscoa', class: 'cat-festa', hue: '#9775fa' },
  { name: 'Festa Junina', class: 'cat-festa', hue: '#e8590c' },
  { name: 'Churrasco', class: 'cat-churrasco', hue: '#9c6644' },
  { name: 'Happy Hour', class: 'cat-happy', hue: '#cc3ac0' },
  { name: 'Confraternização', class: 'cat-happy', hue: '#1098ad' },
  { name: 'Formatura', class: 'cat-formatura', hue: '#5f3dc4' },
  { name: 'Chá de bebê', class: 'cat-aniversario', hue: '#339af0' },
  { name: 'Chá de panela', class: 'cat-casamento', hue: '#66a80f' },
  { name: 'Batizado', class: 'cat-aniversario', hue: '#748ffc' },
  { name: 'Reunião de família', class: 'cat-churrasco', hue: '#5c7a99' },
] as const;

/** Colours for categories the organizer types: picked by name, so one stays the same. */
const CUSTOM_CATEGORY_HUES = ['#7048e8', '#1971c2', '#c2255c', '#0b7285', '#9c36b5', '#4263eb'];
const NO_CATEGORY_HUE = '#868e96';

/** The tag colour of a category, ready-made or typed by the organizer. */
export function getCategoryHue(category?: string | null): string {
  const norm = category?.trim().toLowerCase() ?? '';
  if (!norm) return NO_CATEGORY_HUE;
  const found = EVENT_CATEGORIES.find((c) => c.name.toLowerCase() === norm);
  if (found) return found.hue;
  let hash = 0;
  for (const char of norm) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CUSTOM_CATEGORY_HUES[hash % CUSTOM_CATEGORY_HUES.length];
}

/** The badge colour class of a category, ready-made or typed by the organizer. */
export function getCategoryClass(category?: string | null): string {
  if (!category) return 'cat-outros';
  const norm = category.trim().toLowerCase();
  const found = EVENT_CATEGORIES.find((c) => c.name.toLowerCase() === norm);
  if (found) return found.class;
  if (norm.includes('aniversário') || norm.includes('aniversario')) return 'cat-aniversario';
  if (norm.includes('casamento') || norm.includes('noivado')) return 'cat-casamento';
  if (
    norm.includes('festa') ||
    norm.includes('junina') ||
    norm.includes('julina') ||
    norm.includes('arraial') ||
    norm.includes('arraiá')
  ) {
    return 'cat-festa';
  }
  if (norm.includes('churrasco')) return 'cat-churrasco';
  if (norm.includes('happy') || norm.includes('bar')) return 'cat-happy';
  if (norm.includes('formatura')) return 'cat-formatura';
  return 'cat-outros';
}

export interface PartyEvent {
  id: string;
  title: string;
  category?: string;
  description: string;
  date: string;
  location: string;
  addressDetails?: AddressDetails;
  pixKey: string | null;
  pixType?: PixType;
  estimatedBudget?: number | null;
  status?: 'active' | 'cancelled';
  createdBy?: string;
  creatorEmail?: string;
  /** The organizer's display name, saved with the event so guests see who invites them. */
  creatorName?: string;
  collaborators?: string[];
  createdAt: string;
  updatedAt: string;
}

export type PartyEventCreate = Omit<PartyEvent, 'id' | 'createdAt' | 'updatedAt'>;
export type PartyEventUpdate = Partial<PartyEventCreate>;
