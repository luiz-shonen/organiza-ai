import { vi, type Mock } from 'vitest';
import { of } from 'rxjs';
import { FirestoreBatchOperations } from '../../core/models';

export type MockFirestoreBatchOps = {
  [K in keyof FirestoreBatchOperations]: Mock<FirestoreBatchOperations[K]> &
    FirestoreBatchOperations[K];
};

export interface MockFirestoreGateway {
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  arrayUnion: ReturnType<typeof vi.fn>;
  arrayRemove: ReturnType<typeof vi.fn>;
  serverTimestamp: ReturnType<typeof vi.fn>;
  timestampToDate: ReturnType<typeof vi.fn>;
  getDoc: ReturnType<typeof vi.fn>;
  getDocWithId: ReturnType<typeof vi.fn>;
  getDocs: ReturnType<typeof vi.fn>;
  getCollectionGroupDocs: ReturnType<typeof vi.fn>;
  setDoc: ReturnType<typeof vi.fn>;
  updateDoc: ReturnType<typeof vi.fn>;
  deleteDoc: ReturnType<typeof vi.fn>;
  addDoc: ReturnType<typeof vi.fn>;
  collectionSnapshot: ReturnType<typeof vi.fn>;
  docSnapshot: ReturnType<typeof vi.fn>;
  runBatch: ReturnType<typeof vi.fn>;
  batchOps: MockFirestoreBatchOps;
}

export function createMockFirestoreGateway(): MockFirestoreGateway {
  const batchOps: MockFirestoreBatchOps = {
    set: vi.fn<FirestoreBatchOperations['set']>(),
    update: vi.fn<FirestoreBatchOperations['update']>(),
    delete: vi.fn<FirestoreBatchOperations['delete']>(),
  };

  const mock: MockFirestoreGateway = {
    where: vi.fn((field, op, val) => ({ type: 'where', field, op, val })),
    orderBy: vi.fn((field, dir) => ({ type: 'orderBy', field, dir })),
    limit: vi.fn((n) => ({ type: 'limit', n })),
    arrayUnion: vi.fn((...elements) => ({ type: 'arrayUnion', elements })),
    arrayRemove: vi.fn((...elements) => ({ type: 'arrayRemove', elements })),
    serverTimestamp: vi.fn(() => ({ type: 'serverTimestamp' })),
    timestampToDate: vi.fn((t: unknown) => {
      if (t instanceof Date) return t;
      if (t && typeof t === 'object' && 'seconds' in t) {
        return new Date(Number(t.seconds) * 1000);
      }
      return null;
    }),
    getDoc: vi.fn().mockResolvedValue(null),
    getDocWithId: vi.fn().mockResolvedValue(null),
    getDocs: vi.fn().mockResolvedValue([]),
    getCollectionGroupDocs: vi.fn().mockResolvedValue([]),
    setDoc: vi.fn().mockResolvedValue(undefined),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    addDoc: vi.fn().mockResolvedValue('mock-new-doc-id'),
    collectionSnapshot: vi.fn().mockReturnValue(of([])),
    docSnapshot: vi.fn().mockReturnValue(of(null)),
    runBatch: vi
      .fn()
      .mockImplementation(async (fn: (batch: FirestoreBatchOperations) => void | Promise<void>) => {
        await fn(batchOps);
      }),
    batchOps,
  };

  return mock;
}
