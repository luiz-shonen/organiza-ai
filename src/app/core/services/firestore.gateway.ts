import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  arrayUnion,
  arrayRemove,
  writeBatch,
  serverTimestamp,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection,
  Timestamp,
  WithFieldValue,
  UpdateData,
  DocumentData,
  SetOptions,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { FirestoreBatchOperations } from '../models';

@Injectable({ providedIn: 'root' })
export class FirestoreGateway {
  private readonly firestore = inject(FirebaseService).firestore;

  where(fieldPath: string, opStr: WhereFilterOp, value: unknown): QueryConstraint {
    return where(fieldPath, opStr, value);
  }

  orderBy(fieldPath: string, directionStr?: OrderByDirection): QueryConstraint {
    return directionStr ? orderBy(fieldPath, directionStr) : orderBy(fieldPath);
  }

  limit(limitNumber: number): QueryConstraint {
    return limit(limitNumber);
  }

  arrayUnion(...elements: unknown[]): unknown {
    return arrayUnion(...elements);
  }

  arrayRemove(...elements: unknown[]): unknown {
    return arrayRemove(...elements);
  }

  serverTimestamp(): unknown {
    return serverTimestamp();
  }

  timestampToDate(timestamp: unknown): Date | null {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      return new Date((timestamp as { seconds: number }).seconds * 1000);
    }
    return null;
  }

  async getDoc<T>(path: string): Promise<T | null> {
    if (typeof window !== 'undefined' && (window as any).__MOCK_DOCUMENTS__) {
      const parts = path.split('/');
      const list = ((window as any).__MOCK_DOCUMENTS__[parts[0]] || []) as (T & { id: string })[];
      const found = list.find((item) => item.id === parts[1]);
      return found ? (found as T) : null;
    }
    const docRef = doc(this.firestore, path);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as T;
  }

  async getDocWithId<T>(path: string): Promise<(T & { id: string }) | null> {
    if (typeof window !== 'undefined' && (window as any).__MOCK_DOCUMENTS__) {
      const parts = path.split('/');
      const list = ((window as any).__MOCK_DOCUMENTS__[parts[0]] || []) as (T & { id: string })[];
      const found = list.find((item) => item.id === parts[1]);
      return found ? { ...found } : null;
    }
    const docRef = doc(this.firestore, path);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...(snap.data() as T),
    };
  }

  async getDocs<T>(path: string, ...queryConstraints: QueryConstraint[]): Promise<(T & { id: string })[]> {
    if (typeof window !== 'undefined' && (window as any).__MOCK_DOCUMENTS__) {
      return [...((window as any).__MOCK_DOCUMENTS__[path] || [])] as (T & { id: string })[];
    }
    const colRef = collection(this.firestore, path);
    const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as T),
    }));
  }

  async getCollectionGroupDocs<T>(collectionId: string, ...queryConstraints: QueryConstraint[]): Promise<(T & { id: string })[]> {
    if (typeof window !== 'undefined' && (window as any).__MOCK_DOCUMENTS__) {
      return [...((window as any).__MOCK_DOCUMENTS__[collectionId] || [])] as (T & { id: string })[];
    }
    const groupRef = collectionGroup(this.firestore, collectionId);
    const q = queryConstraints.length > 0 ? query(groupRef, ...queryConstraints) : groupRef;
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as T),
    }));
  }

  async setDoc<T extends DocumentData = DocumentData>(path: string, data: Partial<T> | WithFieldValue<T>, options?: SetOptions): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).__MOCK_DOCUMENTS__) {
      const parts = path.split('/');
      const col = parts[0];
      const id = parts[1];
      const store = (window as any).__MOCK_DOCUMENTS__;
      if (!store[col]) store[col] = [];
      const idx = store[col].findIndex((item: any) => item.id === id);
      if (idx !== -1) {
        store[col][idx] = options && 'merge' in options && options.merge ? { ...store[col][idx], ...(data as object) } : { id, ...(data as object) };
      } else {
        store[col].push({ id, ...(data as object) });
      }
      window.dispatchEvent(new CustomEvent('__mock_doc_change__', { detail: { path } }));
      return;
    }
    const docRef = doc(this.firestore, path);
    if (options) {
      await setDoc(docRef, data as WithFieldValue<DocumentData>, options);
    } else {
      await setDoc(docRef, data as WithFieldValue<DocumentData>);
    }
  }

  async updateDoc<T extends DocumentData = DocumentData>(path: string, data: Partial<T> | UpdateData<T>): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).__MOCK_DOCUMENTS__) {
      const parts = path.split('/');
      const col = parts[0];
      const id = parts[1];
      const store = (window as any).__MOCK_DOCUMENTS__;
      if (store[col]) {
        const idx = store[col].findIndex((item: any) => item.id === id);
        if (idx !== -1) {
          store[col][idx] = { ...store[col][idx], ...(data as object) };
        }
      }
      window.dispatchEvent(new CustomEvent('__mock_doc_change__', { detail: { path } }));
      return;
    }
    const docRef = doc(this.firestore, path);
    await updateDoc(docRef, data as UpdateData<DocumentData>);
  }

  async deleteDoc(path: string): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).__MOCK_DOCUMENTS__) {
      const parts = path.split('/');
      const col = parts[0];
      const id = parts[1];
      const store = (window as any).__MOCK_DOCUMENTS__;
      if (store[col]) {
        store[col] = store[col].filter((item: any) => item.id !== id);
      }
      window.dispatchEvent(new CustomEvent('__mock_doc_change__', { detail: { path } }));
      return;
    }
    const docRef = doc(this.firestore, path);
    await deleteDoc(docRef);
  }

  async addDoc<T extends DocumentData = DocumentData>(path: string, data: T | WithFieldValue<T>): Promise<string> {
    if (typeof window !== 'undefined' && (window as any).__MOCK_DOCUMENTS__) {
      const store = (window as any).__MOCK_DOCUMENTS__;
      if (!store[path]) store[path] = [];
      const newId = 'doc_' + Math.random().toString(36).substring(2, 9);
      store[path].push({ id: newId, ...(data as object) });
      window.dispatchEvent(new CustomEvent('__mock_doc_change__', { detail: { path } }));
      return newId;
    }
    const colRef = collection(this.firestore, path);
    const docRef = await addDoc(colRef, data as WithFieldValue<DocumentData>);
    return docRef.id;
  }

  collectionSnapshot<T>(path: string, ...queryConstraints: QueryConstraint[]): Observable<(T & { id: string })[]> {
    if (typeof window !== 'undefined' && (window as any).__MOCK_DOCUMENTS__) {
      return new Observable<(T & { id: string })[]>((subscriber) => {
        const store = (window as any).__MOCK_DOCUMENTS__;
        const emit = () => {
          const docs = (store[path] || []) as (T & { id: string })[];
          subscriber.next([...docs]);
        };
        emit();
        const handler = (e: Event) => {
          const customEvent = e as CustomEvent;
          if (customEvent.detail?.path === path || customEvent.detail?.path?.startsWith(path)) {
            emit();
          }
        };
        window.addEventListener('__mock_doc_change__', handler);
        return () => window.removeEventListener('__mock_doc_change__', handler);
      });
    }
    return new Observable<(T & { id: string })[]>((subscriber) => {
      const colRef = collection(this.firestore, path);
      const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;

      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as T),
          }));
          subscriber.next(items);
        },
        (err) => subscriber.error(err),
      );

      return () => unsubscribe();
    });
  }

  docSnapshot<T>(path: string): Observable<(T & { id: string }) | null> {
    if (typeof window !== 'undefined' && (window as any).__MOCK_DOCUMENTS__) {
      return new Observable<(T & { id: string }) | null>((subscriber) => {
        const parts = path.split('/');
        const col = parts[0];
        const id = parts[1];
        const store = (window as any).__MOCK_DOCUMENTS__;
        const emit = () => {
          const list = (store[col] || []) as (T & { id: string })[];
          const doc = list.find((item) => item.id === id) || null;
          subscriber.next(doc ? { ...doc } : null);
        };
        emit();
        const handler = (e: Event) => {
          const customEvent = e as CustomEvent;
          if (customEvent.detail?.path === path || customEvent.detail?.path?.startsWith(col)) {
            emit();
          }
        };
        window.addEventListener('__mock_doc_change__', handler);
        return () => window.removeEventListener('__mock_doc_change__', handler);
      });
    }
    return new Observable<(T & { id: string }) | null>((subscriber) => {
      const docRef = doc(this.firestore, path);

      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (!snap.exists()) {
            subscriber.next(null);
          } else {
            subscriber.next({
              id: snap.id,
              ...(snap.data() as T),
            });
          }
        },
        (err) => subscriber.error(err),
      );

      return () => unsubscribe();
    });
  }

  async runBatch(fn: (batch: FirestoreBatchOperations) => void | Promise<void>): Promise<void> {
    const batch = writeBatch(this.firestore);
    const ops: FirestoreBatchOperations = {
      set: (path, data, options) => {
        const docRef = doc(this.firestore, path);
        if (options) {
          batch.set(docRef, data as WithFieldValue<DocumentData>, options);
        } else {
          batch.set(docRef, data as WithFieldValue<DocumentData>);
        }
      },
      update: (path, data) => {
        const docRef = doc(this.firestore, path);
        batch.update(docRef, data as UpdateData<DocumentData>);
      },
      delete: (path) => {
        const docRef = doc(this.firestore, path);
        batch.delete(docRef);
      },
    };
    await fn(ops);
    await batch.commit();
  }
}
