export interface Guest {
  id: string;
  name: string;
  phone: string;
  companionsCount: number;
  createdAt: string;
}

export type GuestCreate = Omit<Guest, 'id' | 'createdAt'>;

export interface GuestSession {
  name: string;
  phone: string;
}
