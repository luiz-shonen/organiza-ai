import { vi } from 'vitest';

export const mockFirestoreBatch = {
  set: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
};

export class MockFirestoreTimestamp {
  constructor(
    public seconds: number,
    public nanoseconds: number,
  ) {}
  toDate() {
    return new Date(this.seconds * 1000);
  }
}

export const firestoreMocks = {
  batch: mockFirestoreBatch,
  collection: vi.fn(),
  collectionGroup: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  writeBatch: vi.fn((..._args: unknown[]) => mockFirestoreBatch),
  arrayUnion: vi.fn((...args: unknown[]) => ({ _type: 'arrayUnion', args })),
  arrayRemove: vi.fn((...args: unknown[]) => ({ _type: 'arrayRemove', args })),
  serverTimestamp: vi.fn(),
  Timestamp: MockFirestoreTimestamp,
};

export const createFirestoreModuleMock = () => ({
  initializeFirestore: vi.fn(),
  collection: (...args: unknown[]) => firestoreMocks.collection(...args),
  collectionGroup: (...args: unknown[]) => firestoreMocks.collectionGroup(...args),
  doc: (...args: unknown[]) => firestoreMocks.doc(...args),
  addDoc: (...args: unknown[]) => firestoreMocks.addDoc(...args),
  setDoc: (...args: unknown[]) => firestoreMocks.setDoc(...args),
  getDoc: (...args: unknown[]) => firestoreMocks.getDoc(...args),
  updateDoc: (...args: unknown[]) => firestoreMocks.updateDoc(...args),
  deleteDoc: (...args: unknown[]) => firestoreMocks.deleteDoc(...args),
  onSnapshot: (...args: unknown[]) => firestoreMocks.onSnapshot(...args),
  orderBy: (...args: unknown[]) => firestoreMocks.orderBy(...args),
  query: (...args: unknown[]) => firestoreMocks.query(...args),
  where: (...args: unknown[]) => firestoreMocks.where(...args),
  limit: (...args: unknown[]) => firestoreMocks.limit(...args),
  getDocs: (...args: unknown[]) => firestoreMocks.getDocs(...args),
  writeBatch: (...args: unknown[]) => firestoreMocks.writeBatch(...args),
  arrayUnion: (...args: unknown[]) => firestoreMocks.arrayUnion(...args),
  arrayRemove: (...args: unknown[]) => firestoreMocks.arrayRemove(...args),
  serverTimestamp: (...args: unknown[]) => firestoreMocks.serverTimestamp(...args),
  Timestamp: firestoreMocks.Timestamp,
});
