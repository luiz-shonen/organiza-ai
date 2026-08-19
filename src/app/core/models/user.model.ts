import { ThemeMode } from '../services/theme.service';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface UserProfile {
  name?: string;
  phone?: string;
  themePref?: ThemeMode;
  createdAt?: Date | string | number | null;
}
