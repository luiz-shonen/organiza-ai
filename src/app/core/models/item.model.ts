export interface ClaimedBy {
  name: string;
  phone: string;
}

export interface PartyItem {
  id: string;
  name: string;
  quantity: number;
  claimedBy: ClaimedBy | null;
}

export type PartyItemCreate = Omit<PartyItem, 'id' | 'claimedBy'>;
