export interface AddressDetails {
  cep?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
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
  status?: 'active' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export type PartyEventCreate = Omit<PartyEvent, 'id' | 'createdAt' | 'updatedAt'>;
export type PartyEventUpdate = Partial<PartyEventCreate>;
