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

export const EVENT_CATEGORIES: readonly EventCategoryOption[] = [
  { name: 'Aniversário', class: 'cat-aniversario' },
  { name: 'Casamento', class: 'cat-casamento' },
  { name: 'Festa Junina', class: 'cat-festa' },
  { name: 'Churrasco', class: 'cat-churrasco' },
  { name: 'Happy Hour', class: 'cat-happy' },
  { name: 'Formatura', class: 'cat-formatura' },
  { name: 'Outros', class: 'cat-outros' },
] as const;

export function getCategoryClass(category?: string | null): string {
  if (!category) return 'cat-outros';
  const norm = category.trim().toLowerCase();
  if (norm.includes('aniversário') || norm.includes('aniversario')) return 'cat-aniversario';
  if (norm.includes('casamento')) return 'cat-casamento';
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
  const found = EVENT_CATEGORIES.find((c) => c.name.toLowerCase() === norm);
  return found?.class ?? 'cat-outros';
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
  collaborators?: string[];
  createdAt: string;
  updatedAt: string;
}

export type PartyEventCreate = Omit<PartyEvent, 'id' | 'createdAt' | 'updatedAt'>;
export type PartyEventUpdate = Partial<PartyEventCreate>;
