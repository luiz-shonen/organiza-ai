export interface ClaimedBy {
  name: string;
  phone: string;
  uid: string;
}

export interface PartyItem {
  id: string;
  name: string;
  quantity: number;
  /** Unit shown next to the quantity ("un.", "L", "pacotes"). */
  unit?: string;
  /** When true, whoever picks the item brings the whole quantity. */
  fixedQuantity?: boolean;
  /** Legacy single claim; new claims live in `events/{eventId}/claims`. */
  claimedBy: ClaimedBy | null;
}

export type PartyItemCreate = Omit<PartyItem, 'id' | 'claimedBy'>;
