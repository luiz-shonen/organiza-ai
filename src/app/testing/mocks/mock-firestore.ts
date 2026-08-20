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
  writeBatch: vi.fn(() => mockFirestoreBatch),
  arrayUnion: vi.fn((...args: unknown[]) => ({ _type: 'arrayUnion', args })),
  arrayRemove: vi.fn((...args: unknown[]) => ({ _type: 'arrayRemove', args })),
  serverTimestamp: vi.fn(),
  Timestamp: MockFirestoreTimestamp,
};

export const createFirestoreModuleMock = () => ({
  initializeFirestore: vi.fn(),
  collection: (...args: any[]) => (firestoreMocks.collection as any)(...args),
  collectionGroup: (...args: any[]) => (firestoreMocks.collectionGroup as any)(...args),
  doc: (...args: any[]) => (firestoreMocks.doc as any)(...args),
  addDoc: (...args: any[]) => (firestoreMocks.addDoc as any)(...args),
  setDoc: (...args: any[]) => (firestoreMocks.setDoc as any)(...args),
  getDoc: (...args: any[]) => (firestoreMocks.getDoc as any)(...args),
  updateDoc: (...args: any[]) => (firestoreMocks.updateDoc as any)(...args),
  deleteDoc: (...args: any[]) => (firestoreMocks.deleteDoc as any)(...args),
  onSnapshot: (...args: any[]) => (firestoreMocks.onSnapshot as any)(...args),
  orderBy: (...args: any[]) => (firestoreMocks.orderBy as any)(...args),
  query: (...args: any[]) => (firestoreMocks.query as any)(...args),
  where: (...args: any[]) => (firestoreMocks.where as any)(...args),
  limit: (...args: any[]) => (firestoreMocks.limit as any)(...args),
  getDocs: (...args: any[]) => (firestoreMocks.getDocs as any)(...args),
  writeBatch: (...args: any[]) => (firestoreMocks.writeBatch as any)(...args),
  arrayUnion: (...args: any[]) => (firestoreMocks.arrayUnion as any)(...args),
  arrayRemove: (...args: any[]) => (firestoreMocks.arrayRemove as any)(...args),
  serverTimestamp: (...args: any[]) => (firestoreMocks.serverTimestamp as any)(...args),
  Timestamp: firestoreMocks.Timestamp,
});
