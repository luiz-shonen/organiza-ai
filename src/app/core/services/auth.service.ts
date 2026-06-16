import { Injectable, signal, computed, inject } from '@angular/core';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { environment } from '../../../environments/environment';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth: Auth = inject(FirebaseService).auth;
  private readonly _currentUser = signal<User | null>(null);
  private readonly _loading = signal(true);

  readonly currentUser = this._currentUser.asReadonly();
  // Admins are authenticated users who are NOT anonymous.
  readonly isAdmin = computed(() => {
    const user = this._currentUser();
    return user !== null && !user.isAnonymous;
  });
  readonly loading = this._loading.asReadonly();

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this._currentUser.set(user);
      this._loading.set(false);
    });
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async loginAnonymously(): Promise<void> {
    // Only sign in anonymously if not already signed in.
    if (!this.auth.currentUser) {
      await signInAnonymously(this.auth);
    }
  }

  async registerAdmin(email: string, password: string): Promise<void> {
    const secondaryApp = initializeApp(environment.firebase, 'SecondaryAppForCreation');
    const secondaryAuth = getAuth(secondaryApp);
    
    try {
      await createUserWithEmailAndPassword(secondaryAuth, email, password);
    } finally {
      await secondaryAuth.signOut();
      await deleteApp(secondaryApp);
    }
  }
}
