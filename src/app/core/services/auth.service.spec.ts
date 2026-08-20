import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import type { User, Auth, UserCredential } from 'firebase/auth';

const mocks = vi.hoisted(() => {
  let authCallback: ((user: User | null) => void) | null = null;

  return {
    getAuthCallback: () => authCallback,
    setAuthCallback: (cb: ((user: User | null) => void) | null) => {
      authCallback = cb;
    },
    mockOnAuthStateChanged: vi.fn((_auth: Auth, callback: (user: User | null) => void) => {
      authCallback = callback;
      return vi.fn();
    }),
    mockSignInWithEmailAndPassword: vi.fn(),
    mockCreateUserWithEmailAndPassword: vi.fn(),
    mockSignInWithPopup: vi.fn(),
    mockSignInAnonymously: vi.fn(),
    mockSignOut: vi.fn(),
    mockSendEmailVerification: vi.fn(),
    MockGoogleAuthProvider: class MockGoogleAuthProvider {},
  };
});

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mocks.mockOnAuthStateChanged,
  signInWithEmailAndPassword: mocks.mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mocks.mockCreateUserWithEmailAndPassword,
  signInWithPopup: mocks.mockSignInWithPopup,
  signInAnonymously: mocks.mockSignInAnonymously,
  signOut: mocks.mockSignOut,
  sendEmailVerification: mocks.mockSendEmailVerification,
  GoogleAuthProvider: mocks.MockGoogleAuthProvider,
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockAuth = {
    currentUser: null as User | null,
    authStateReady: vi.fn().mockResolvedValue(undefined),
  } as unknown as Auth;

  const mockFirestore = {} as any;

  const superAdminUser = {
    uid: 'super-admin-uid',
    email: 'luiz.gmr.dev@gmail.com',
    displayName: 'Super Admin Luiz',
    emailVerified: true,
    isAnonymous: false,
  } as unknown as User;

  const regularUser = {
    uid: 'regular-user-uid',
    email: 'organizer@test.com',
    displayName: 'Organizer Test',
    emailVerified: false,
    isAnonymous: false,
  } as unknown as User;

  beforeEach(() => {
    vi.clearAllMocks();
    (mockAuth as any).currentUser = null;
    (mockAuth.authStateReady as any).mockResolvedValue(undefined);
    mocks.setAuthCallback(null);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: FirebaseService,
          useValue: {
            auth: mockAuth,
            firestore: mockFirestore,
          },
        },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  describe('isSuperAdminEmail helper', () => {
    it('returns true for configured superadmin emails', () => {
      expect(service.isSuperAdminEmail('luiz.gmr.dev@gmail.com')).toBe(true);
      expect(service.isSuperAdminEmail('jessica.calm.dev@gmail.com')).toBe(true);
    });

    it('returns false for non-superadmin emails and null', () => {
      expect(service.isSuperAdminEmail('user@test.com')).toBe(false);
      expect(service.isSuperAdminEmail('admin@organizaai.com')).toBe(false);
      expect(service.isSuperAdminEmail(null)).toBe(false);
      expect(service.isSuperAdminEmail('')).toBe(false);
    });
  });

  describe('onAuthStateChanged listener', () => {
    it('sets currentUser, isSuperAdmin=true, and loading=false when superadmin user emits', () => {
      const cb = mocks.getAuthCallback();
      expect(cb).toBeDefined();
      cb!(superAdminUser);

      expect(service.currentUser()).toEqual(superAdminUser);
      expect(service.isSuperAdmin()).toBe(true);
      expect(service.isAdmin()).toBe(true);
      expect(service.loading()).toBe(false);
    });

    it('sets currentUser, isSuperAdmin=false, and loading=false when regular user emits', () => {
      const cb = mocks.getAuthCallback();
      expect(cb).toBeDefined();
      cb!(regularUser);

      expect(service.currentUser()).toEqual(regularUser);
      expect(service.isSuperAdmin()).toBe(false);
      expect(service.isAdmin()).toBe(false);
      expect(service.loading()).toBe(false);
    });

    it('sets currentUser=null, isSuperAdmin=false, and loading=false when null emits', () => {
      const cb = mocks.getAuthCallback();
      expect(cb).toBeDefined();
      cb!(null);

      expect(service.currentUser()).toBeNull();
      expect(service.isSuperAdmin()).toBe(false);
      expect(service.isAdmin()).toBe(false);
      expect(service.loading()).toBe(false);
    });
  });

  describe('register (Email & Password)', () => {
    it('creates user, dispatches sendEmailVerification, and updates state', async () => {
      const mockCredential = { user: regularUser } as UserCredential;
      mocks.mockCreateUserWithEmailAndPassword.mockResolvedValue(mockCredential);
      mocks.mockSendEmailVerification.mockResolvedValue(undefined);

      await service.register('organizer@test.com', 'password123');

      expect(mocks.mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'organizer@test.com',
        'password123',
      );
      expect(mocks.mockSendEmailVerification).toHaveBeenCalledWith(regularUser);
      expect(service.currentUser()).toEqual(regularUser);
      expect(service.isSuperAdmin()).toBe(false);
    });

    it('creates superadmin user and updates isSuperAdmin signal to true', async () => {
      const mockCredential = { user: superAdminUser } as UserCredential;
      mocks.mockCreateUserWithEmailAndPassword.mockResolvedValue(mockCredential);
      mocks.mockSendEmailVerification.mockResolvedValue(undefined);

      await service.register('luiz.gmr.dev@gmail.com', 'superSecret123');

      expect(mocks.mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'luiz.gmr.dev@gmail.com',
        'superSecret123',
      );
      expect(mocks.mockSendEmailVerification).toHaveBeenCalledWith(superAdminUser);
      expect(service.currentUser()).toEqual(superAdminUser);
      expect(service.isSuperAdmin()).toBe(true);
    });
  });

  describe('login (Email & Password)', () => {
    it('signs in with email and password and updates current user state', async () => {
      const mockCredential = { user: regularUser } as UserCredential;
      mocks.mockSignInWithEmailAndPassword.mockResolvedValue(mockCredential);

      await service.login('organizer@test.com', 'password123');

      expect(mocks.mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'organizer@test.com',
        'password123',
      );
      expect(service.currentUser()).toEqual(regularUser);
      expect(service.isSuperAdmin()).toBe(false);
    });

    it('signs in superadmin user and updates isSuperAdmin signal to true', async () => {
      const mockCredential = { user: superAdminUser } as UserCredential;
      mocks.mockSignInWithEmailAndPassword.mockResolvedValue(mockCredential);

      await service.login('luiz.gmr.dev@gmail.com', 'superSecret123');

      expect(mocks.mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'luiz.gmr.dev@gmail.com',
        'superSecret123',
      );
      expect(service.currentUser()).toEqual(superAdminUser);
      expect(service.isSuperAdmin()).toBe(true);
    });
  });

  describe('loginWithGoogle', () => {
    it('initiates popup sign-in, updates user and verifies superadmin status', async () => {
      const mockCredential = { user: superAdminUser } as UserCredential;
      mocks.mockSignInWithPopup.mockResolvedValue(mockCredential);

      await service.loginWithGoogle();

      expect(mocks.mockSignInWithPopup).toHaveBeenCalledWith(
        mockAuth,
        expect.any(mocks.MockGoogleAuthProvider),
      );
      expect(service.currentUser()).toEqual(superAdminUser);
      expect(service.isSuperAdmin()).toBe(true);
    });

    it('updates user and sets isSuperAdmin to false for non-superadmin Google user', async () => {
      const mockCredential = { user: regularUser } as UserCredential;
      mocks.mockSignInWithPopup.mockResolvedValue(mockCredential);

      await service.loginWithGoogle();

      expect(mocks.mockSignInWithPopup).toHaveBeenCalledWith(
        mockAuth,
        expect.any(mocks.MockGoogleAuthProvider),
      );
      expect(service.currentUser()).toEqual(regularUser);
      expect(service.isSuperAdmin()).toBe(false);
    });
  });

  describe('sendVerificationEmail', () => {
    it('dispatches sendEmailVerification when auth.currentUser is present', async () => {
      (mockAuth as any).currentUser = regularUser;
      mocks.mockSendEmailVerification.mockResolvedValue(undefined);

      await service.sendVerificationEmail();

      expect(mocks.mockSendEmailVerification).toHaveBeenCalledWith(regularUser);
    });

    it('does nothing when auth.currentUser is null', async () => {
      (mockAuth as any).currentUser = null;

      await service.sendVerificationEmail();

      expect(mocks.mockSendEmailVerification).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('calls signOut and resets auth state', async () => {
      const cb = mocks.getAuthCallback();
      cb!(superAdminUser);
      expect(service.currentUser()).toEqual(superAdminUser);
      expect(service.isSuperAdmin()).toBe(true);

      mocks.mockSignOut.mockResolvedValue(undefined);

      await service.logout();

      expect(mocks.mockSignOut).toHaveBeenCalledWith(mockAuth);
      expect(service.currentUser()).toBeNull();
      expect(service.isSuperAdmin()).toBe(false);
    });
  });

  describe('loginAnonymously', () => {
    it('calls signInAnonymously when no current user is logged in', async () => {
      const anonUser = {
        uid: 'anon-123',
        isAnonymous: true,
        email: null,
      } as unknown as User;

      (mockAuth as any).currentUser = null;
      mocks.mockSignInAnonymously.mockImplementation(async () => {
        (mockAuth as any).currentUser = anonUser;
        return { user: anonUser } as UserCredential;
      });

      await service.loginAnonymously();

      expect(mockAuth.authStateReady).toHaveBeenCalled();
      expect(mocks.mockSignInAnonymously).toHaveBeenCalledWith(mockAuth);
      expect(service.currentUser()).toEqual(anonUser);
      expect(service.isSuperAdmin()).toBe(false);
    });

    it('does not call signInAnonymously if already logged in', async () => {
      (mockAuth as any).currentUser = regularUser;

      await service.loginAnonymously();

      expect(mockAuth.authStateReady).toHaveBeenCalled();
      expect(mocks.mockSignInAnonymously).not.toHaveBeenCalled();
    });
  });
});
