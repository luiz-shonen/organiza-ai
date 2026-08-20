import { Injectable, signal, inject } from '@angular/core';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth: Auth = inject(FirebaseService).auth;
  private readonly firestore = inject(FirebaseService).firestore;
  private readonly _currentUser = signal<User | null>(null);
  private readonly _loading = signal(true);
  private readonly _isSuperAdmin = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAdmin = this._isSuperAdmin.asReadonly();
  readonly isSuperAdmin = this._isSuperAdmin.asReadonly();
  readonly loading = this._loading.asReadonly();

  isSuperAdminEmail(email: string | null): boolean {
    return email === 'luiz.gmr.dev@gmail.com' || email === 'jessica.calm.dev@gmail.com';
  }

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this._isSuperAdmin.set(this.isSuperAdminEmail(user?.email ?? null));
      this._currentUser.set(user);
      this._loading.set(false);
    });
  }

  async register(email: string, password: string): Promise<void> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await sendEmailVerification(result.user);
    this._currentUser.set(result.user);
    this._isSuperAdmin.set(this.isSuperAdminEmail(result.user.email));
  }

  async login(email: string, password: string): Promise<void> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    this._currentUser.set(result.user);
    this._isSuperAdmin.set(this.isSuperAdminEmail(result.user.email));
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this._currentUser.set(null);
    this._isSuperAdmin.set(false);
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    this._currentUser.set(result.user);
    this._isSuperAdmin.set(this.isSuperAdminEmail(result.user.email));
  }

  async sendVerificationEmail(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
    }
  }

  async loginAnonymously(): Promise<void> {
    await this.auth.authStateReady();
    // Only sign in anonymously if not already signed in.
    if (!this.auth.currentUser) {
      await signInAnonymously(this.auth);
      this._currentUser.set(this.auth.currentUser);
      this._isSuperAdmin.set(false);
    }
  }

  async registerAdmin(email: string): Promise<void> {
    if (!this._isSuperAdmin()) {
      throw new Error('Apenas super administradores podem cadastrar novos admins.');
    }
    // Register in admins collection
    await setDoc(doc(this.firestore, 'admins', email), {
      createdAt: serverTimestamp(),
    });
  }

  async listAdmins(): Promise<string[]> {
    if (!this._isSuperAdmin()) {
      throw new Error('Apenas super administradores podem listar admins.');
    }
    const { collection, getDocs } = await import('firebase/firestore');
    const snap = await getDocs(collection(this.firestore, 'admins'));
    return snap.docs.map((d) => d.id);
  }

  async removeAdmin(email: string): Promise<void> {
    if (!this._isSuperAdmin()) {
      throw new Error('Apenas super administradores podem remover admins.');
    }
    if (this.isSuperAdminEmail(email)) {
      throw new Error('Super administradores não podem ser removidos.');
    }
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(this.firestore, 'admins', email));
  }
}
