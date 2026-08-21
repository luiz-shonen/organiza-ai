export interface GuestCompanion {
  name: string;
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  isConfirmed: boolean;
  confirmedAt: string;
  primaryGuestId?: string;
  uid?: string;
  companions?: GuestCompanion[];
  companionsCount?: number;
  createdAt?: string;
}

export type GuestCreate = Omit<Guest, 'id' | 'createdAt' | 'uid' | 'isConfirmed' | 'confirmedAt'> & {
  isConfirmed?: boolean;
  confirmedAt?: string;
};

export interface GuestSession {
  name: string;
  phone: string;
}
