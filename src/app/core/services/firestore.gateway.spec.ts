import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FirestoreGateway } from './firestore.gateway';
import { FirebaseService } from './firebase.service';

const { firestoreMocks } = vi.hoisted(() => {
  const batch = {
    set: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };

  class MockTimestamp {
    constructor(
      public seconds: number,
      public nanoseconds: number,
    ) {}
    toDate() {
      return new Date(this.seconds * 1000);
    }
  }

  const mocks = {
    batch,
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
    writeBatch: vi.fn(() => batch),
    arrayUnion: vi.fn((...args: unknown[]) => ({ _type: 'arrayUnion', args })),
    arrayRemove: vi.fn((...args: unknown[]) => ({ _type: 'arrayRemove', args })),
    serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
    Timestamp: MockTimestamp,
  };

  return { firestoreMocks: mocks };
});

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  getFirestore: vi.fn(),
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
}));

vi.mock('@firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  getFirestore: vi.fn(),
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
}));

describe('FirestoreGateway', () => {
  let gateway: FirestoreGateway;
  const mockFirestore = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.doc.mockReturnValue('mock-doc-ref' as any);
    firestoreMocks.collection.mockReturnValue('mock-col-ref' as any);
    firestoreMocks.collectionGroup.mockReturnValue('mock-group-ref' as any);
    firestoreMocks.query.mockReturnValue('mock-query-ref' as any);
    firestoreMocks.where.mockReturnValue('mock-where-constraint' as any);
    firestoreMocks.orderBy.mockReturnValue('mock-orderby-constraint' as any);
    firestoreMocks.limit.mockReturnValue('mock-limit-constraint' as any);
    firestoreMocks.writeBatch.mockReturnValue(firestoreMocks.batch as any);

    TestBed.configureTestingModule({
      providers: [
        FirestoreGateway,
        {
          provide: FirebaseService,
          useValue: { firestore: mockFirestore },
        },
      ],
    });

    gateway = TestBed.inject(FirestoreGateway);
  });

  it('should be created', () => {
    expect(gateway).toBeTruthy();
  });

  describe('query helpers', () => {
    it('creates where constraint', () => {
      gateway.where('status', '==', 'active');
      expect(firestoreMocks.where).toHaveBeenCalledWith('status', '==', 'active');
    });

    it('creates orderBy constraint', () => {
      gateway.orderBy('date', 'desc');
      expect(firestoreMocks.orderBy).toHaveBeenCalledWith('date', 'desc');
    });

    it('creates limit constraint', () => {
      gateway.limit(10);
      expect(firestoreMocks.limit).toHaveBeenCalledWith(10);
    });

    it('delegates arrayUnion and arrayRemove', () => {
      gateway.arrayUnion('val1');
      expect(firestoreMocks.arrayUnion).toHaveBeenCalledWith('val1');

      gateway.arrayRemove('val2');
      expect(firestoreMocks.arrayRemove).toHaveBeenCalledWith('val2');
    });

    it('delegates serverTimestamp', () => {
      gateway.serverTimestamp();
      expect(firestoreMocks.serverTimestamp).toHaveBeenCalled();
    });

    it('converts Timestamp to Date properly', () => {
      const ts = new firestoreMocks.Timestamp(1600000000, 0);
      const date = gateway.timestampToDate(ts);
      expect(date).toBeInstanceOf(Date);
      expect(date?.getTime()).toBe(1600000000 * 1000);

      expect(gateway.timestampToDate(null)).toBeNull();
      expect(gateway.timestampToDate(undefined)).toBeNull();
    });
  });

  describe('CRUD operations', () => {
    it('getDoc returns null when document does not exist', async () => {
      firestoreMocks.getDoc.mockResolvedValue({ exists: () => false } as any);

      const result = await gateway.getDoc('users/123');
      expect(firestoreMocks.doc).toHaveBeenCalledWith(mockFirestore, 'users/123');
      expect(result).toBeNull();
    });

    it('getDoc returns data when document exists', async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'Luiz' }),
      } as any);

      const result = await gateway.getDoc<{ name: string }>('users/123');
      expect(result).toEqual({ name: 'Luiz' });
    });

    it('getDocWithId returns null when document does not exist', async () => {
      firestoreMocks.getDoc.mockResolvedValue({ exists: () => false } as any);

      const result = await gateway.getDocWithId('users/123');
      expect(result).toBeNull();
    });

    it('getDocWithId returns data including id when document exists', async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        id: '123',
        exists: () => true,
        data: () => ({ name: 'Luiz' }),
      } as any);

      const result = await gateway.getDocWithId<{ name: string }>('users/123');
      expect(result).toEqual({ id: '123', name: 'Luiz' });
    });

    it('getDocs executes collection query and returns mapped array', async () => {
      firestoreMocks.getDocs.mockResolvedValue({
        docs: [
          { id: '1', data: () => ({ title: 'Event 1' }) },
          { id: '2', data: () => ({ title: 'Event 2' }) },
        ],
      } as any);

      const result = await gateway.getDocs<{ title: string }>('events');
      expect(firestoreMocks.collection).toHaveBeenCalledWith(mockFirestore, 'events');
      expect(result).toEqual([
        { id: '1', title: 'Event 1' },
        { id: '2', title: 'Event 2' },
      ]);
    });

    it('getCollectionGroupDocs executes collectionGroup query and returns mapped array', async () => {
      firestoreMocks.getDocs.mockResolvedValue({
        docs: [{ id: 'g1', data: () => ({ name: 'Guest 1' }) }],
      } as any);

      const result = await gateway.getCollectionGroupDocs<{ name: string }>('guests');
      expect(firestoreMocks.collectionGroup).toHaveBeenCalledWith(mockFirestore, 'guests');
      expect(result).toEqual([{ id: 'g1', name: 'Guest 1' }]);
    });

    it('setDoc delegates to setDoc with and without options', async () => {
      await gateway.setDoc('users/123', { name: 'Luiz' });
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith('mock-doc-ref', { name: 'Luiz' });

      await gateway.setDoc('users/123', { name: 'Luiz' }, { merge: true });
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        { name: 'Luiz' },
        { merge: true },
      );
    });

    it('updateDoc delegates to updateDoc', async () => {
      await gateway.updateDoc('users/123', { name: 'Updated' });
      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith('mock-doc-ref', { name: 'Updated' });
    });

    it('deleteDoc delegates to deleteDoc', async () => {
      await gateway.deleteDoc('users/123');
      expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('addDoc creates document and returns its id', async () => {
      firestoreMocks.addDoc.mockResolvedValue({ id: 'new-id-999' } as any);

      const id = await gateway.addDoc('events', { title: 'Party' });
      expect(firestoreMocks.addDoc).toHaveBeenCalledWith('mock-col-ref', { title: 'Party' });
      expect(id).toBe('new-id-999');
    });
  });

  describe('snapshots', () => {
    it('collectionSnapshot emits mapped documents on change', () => {
      let snapshotCallback: (snap: any) => void = () => {};
      firestoreMocks.onSnapshot.mockImplementation((_query: any, cb: any) => {
        snapshotCallback = cb;
        return () => {};
      });

      let emitted: any[] = [];
      gateway.collectionSnapshot('events').subscribe((data) => {
        emitted = data;
      });

      snapshotCallback({
        docs: [{ id: 'evt-1', data: () => ({ title: 'Birthday' }) }],
      });

      expect(emitted).toEqual([{ id: 'evt-1', title: 'Birthday' }]);
    });

    it('docSnapshot emits document or null on change', () => {
      let snapshotCallback: (snap: any) => void = () => {};
      firestoreMocks.onSnapshot.mockImplementation((_ref: any, cb: any) => {
        snapshotCallback = cb;
        return () => {};
      });

      let emitted: any = undefined;
      gateway.docSnapshot('events/evt-1').subscribe((data) => {
        emitted = data;
      });

      snapshotCallback({
        exists: () => true,
        id: 'evt-1',
        data: () => ({ title: 'Birthday' }),
      });
      expect(emitted).toEqual({ id: 'evt-1', title: 'Birthday' });

      snapshotCallback({
        exists: () => false,
      });
      expect(emitted).toBeNull();
    });
  });

  describe('runBatch', () => {
    it('executes batch operations and commits atomically', async () => {
      await gateway.runBatch((batch) => {
        batch.set('users/1', { name: 'One' });
        batch.update('users/2', { name: 'Two' });
        batch.delete('users/3');
      });

      expect(firestoreMocks.writeBatch).toHaveBeenCalledWith(mockFirestore);
      expect(firestoreMocks.batch.set).toHaveBeenCalledWith('mock-doc-ref', { name: 'One' });
      expect(firestoreMocks.batch.update).toHaveBeenCalledWith('mock-doc-ref', { name: 'Two' });
      expect(firestoreMocks.batch.delete).toHaveBeenCalledWith('mock-doc-ref');
      expect(firestoreMocks.batch.commit).toHaveBeenCalled();
    });
  });
});
