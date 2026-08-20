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
    const docRef = doc(this.firestore, path);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as T;
  }

  async getDocWithId<T>(path: string): Promise<(T & { id: string }) | null> {
    const docRef = doc(this.firestore, path);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...(snap.data() as T),
    };
  }

  async getDocs<T>(path: string, ...queryConstraints: QueryConstraint[]): Promise<(T & { id: string })[]> {
    const colRef = collection(this.firestore, path);
    const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as T),
    }));
  }

  async getCollectionGroupDocs<T>(collectionId: string, ...queryConstraints: QueryConstraint[]): Promise<(T & { id: string })[]> {
    const groupRef = collectionGroup(this.firestore, collectionId);
    const q = queryConstraints.length > 0 ? query(groupRef, ...queryConstraints) : groupRef;
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as T),
    }));
  }

  async setDoc<T>(path: string, data: Partial<T>, options?: { merge?: boolean }): Promise<void> {
    const docRef = doc(this.firestore, path);
    if (options) {
      await setDoc(docRef, data as any, options);
    } else {
      await setDoc(docRef, data as any);
    }
  }

  async updateDoc<T>(path: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.firestore, path);
    await updateDoc(docRef, data as any);
  }

  async deleteDoc(path: string): Promise<void> {
    const docRef = doc(this.firestore, path);
    await deleteDoc(docRef);
  }

  async addDoc<T>(path: string, data: T): Promise<string> {
    const colRef = collection(this.firestore, path);
    const docRef = await addDoc(colRef, data as any);
    return docRef.id;
  }

  collectionSnapshot<T>(path: string, ...queryConstraints: QueryConstraint[]): Observable<(T & { id: string })[]> {
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
          batch.set(docRef, data as any, options);
        } else {
          batch.set(docRef, data as any);
        }
      },
      update: (path, data) => {
        const docRef = doc(this.firestore, path);
        batch.update(docRef, data as any);
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
