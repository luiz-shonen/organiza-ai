import { ThemeMode } from '../services/theme.service';

export interface UserProfile {
  name?: string;
  phone?: string;
  themePref?: ThemeMode;
  createdAt?: any;
}
