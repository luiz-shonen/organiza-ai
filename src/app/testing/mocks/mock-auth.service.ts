import { Injectable, signal, WritableSignal } from '@angular/core';
import type { User } from 'firebase/auth';
import { vi } from 'vitest';

@Injectable({ providedIn: 'root' })
export class MockAuthService {
  readonly currentUser: WritableSignal<User | null> = signal<User | null>(null);
  readonly isAdmin: WritableSignal<boolean> = signal<boolean>(false);
  readonly isSuperAdmin: WritableSignal<boolean> = signal<boolean>(false);
  readonly loading: WritableSignal<boolean> = signal<boolean>(false);

  readonly isSuperAdminEmail = vi.fn((email: string | null): boolean => {
    return email === 'luiz.gmr.dev@gmail.com' || email === 'jessica.calm.dev@gmail.com';
  });

  readonly register = vi.fn((_email: string, _password: string): Promise<void> => Promise.resolve());
  readonly login = vi.fn((_email: string, _password: string): Promise<void> => Promise.resolve());
  readonly logout = vi.fn((): Promise<void> => {
    this.currentUser.set(null);
    this.isAdmin.set(false);
    this.isSuperAdmin.set(false);
    return Promise.resolve();
  });
  readonly loginWithGoogle = vi.fn((): Promise<void> => Promise.resolve());
  readonly sendVerificationEmail = vi.fn((): Promise<void> => Promise.resolve());
  readonly loginAnonymously = vi.fn((): Promise<void> => Promise.resolve());
  readonly registerAdmin = vi.fn((_email: string): Promise<void> => Promise.resolve());
  readonly listAdmins = vi.fn((): Promise<string[]> => Promise.resolve([]));
  readonly removeAdmin = vi.fn((_email: string): Promise<void> => Promise.resolve());
}
