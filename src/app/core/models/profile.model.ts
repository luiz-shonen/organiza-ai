import type { ThemeMode } from './theme.model';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  name?: string;
  phone?: string;
  /** Companions outside the family the member has brought, offered again on the next RSVP. */
  savedCompanions?: string[];
  themePref?: ThemeMode;
  createdAt: string;
  updatedAt: string;
}
