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
}

/** Ready-made categories; the editor also lets people type their own. */
export const EVENT_CATEGORIES: readonly EventCategoryOption[] = [
  { name: 'Aniversário', class: 'cat-aniversario' },
  { name: 'Casamento', class: 'cat-casamento' },
  { name: 'Natal', class: 'cat-festa' },
  { name: 'Ano Novo', class: 'cat-festa' },
  { name: 'Páscoa', class: 'cat-festa' },
  { name: 'Festa Junina', class: 'cat-festa' },
  { name: 'Churrasco', class: 'cat-churrasco' },
  { name: 'Happy Hour', class: 'cat-happy' },
  { name: 'Confraternização', class: 'cat-happy' },
  { name: 'Formatura', class: 'cat-formatura' },
  { name: 'Chá de bebê', class: 'cat-aniversario' },
  { name: 'Chá de panela', class: 'cat-casamento' },
  { name: 'Batizado', class: 'cat-aniversario' },
  { name: 'Reunião de família', class: 'cat-churrasco' },
] as const;

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
