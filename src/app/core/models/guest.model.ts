export interface Guest {
  id: string;
  name: string;
  phone: string;
  companionsCount: number;
  createdAt: string;
  uid: string;
}

export type GuestCreate = Omit<Guest, 'id' | 'createdAt' | 'uid'>;

export interface GuestSession {
  name: string;
  phone: string;
}
