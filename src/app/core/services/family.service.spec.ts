import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FamilyService } from './family.service';
import { FirebaseService } from './firebase.service';

const mocks = vi.hoisted(() => ({
  mockCollection: vi.fn(),
  mockDoc: vi.fn(),
  mockAddDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockGetDocs: vi.fn(),
  mockQuery: vi.fn(),
  mockOrderBy: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  collection: mocks.mockCollection,
  doc: mocks.mockDoc,
  addDoc: mocks.mockAddDoc,
  deleteDoc: mocks.mockDeleteDoc,
  getDocs: mocks.mockGetDocs,
  query: mocks.mockQuery,
  orderBy: mocks.mockOrderBy,
  Timestamp: class Timestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() {
      return new Date(this.seconds * 1000);
    }
  },
}));

describe('FamilyService', () => {
  let service: FamilyService;
  const mockFirestore = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        FamilyService,
        {
          provide: FirebaseService,
          useValue: {
            firestore: mockFirestore,
          },
        },
      ],
    });

    service = TestBed.inject(FamilyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFamilyMembers', () => {
    it('returns empty array when uid is not provided', async () => {
      const result = await service.getFamilyMembers('');
      expect(result).toEqual([]);
      expect(mocks.mockGetDocs).not.toHaveBeenCalled();
    });

    it('fetches and maps family members correctly', async () => {
      const mockDocs = [
        {
          id: 'fam-1',
          data: () => ({
            name: 'Lucas',
            relationship: 'child',
            createdAt: '2026-08-10T10:00:00.000Z',
          }),
        },
        {
          id: 'fam-2',
          data: () => ({
            name: 'Mariana',
            relationship: 'spouse',
            phone: '11988887777',
            createdAt: '2026-08-11T10:00:00.000Z',
          }),
        },
      ];

      mocks.mockCollection.mockReturnValue('family-col-ref' as any);
      mocks.mockOrderBy.mockReturnValue('order-ref' as any);
      mocks.mockQuery.mockReturnValue('family-query-ref' as any);
      mocks.mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const result = await service.getFamilyMembers('user-123');

      expect(mocks.mockCollection).toHaveBeenCalledWith(mockFirestore, 'users/user-123/family');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'fam-1',
        name: 'Lucas',
        relationship: 'child',
        phone: undefined,
        createdAt: '2026-08-10T10:00:00.000Z',
      });
      expect(result[1].name).toBe('Mariana');
      expect(result[1].relationship).toBe('spouse');
      expect(result[1].phone).toBe('11988887777');
    });

    it('handles Timestamp createdAt properly', async () => {
      const mockDoc = {
        id: 'fam-3',
        data: () => ({
          name: 'Carla',
          relationship: 'relative',
          createdAt: { toDate: () => new Date('2026-08-15T12:00:00.000Z') },
        }),
      };

      mocks.mockCollection.mockReturnValue('family-col-ref' as any);
      mocks.mockQuery.mockReturnValue('family-query-ref' as any);
      mocks.mockGetDocs.mockResolvedValue({ docs: [mockDoc] });

      const result = await service.getFamilyMembers('user-123');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Carla');
    });

    it('returns empty array when getDocs throws error', async () => {
      mocks.mockCollection.mockReturnValue('family-col-ref' as any);
      mocks.mockQuery.mockReturnValue('family-query-ref' as any);
      mocks.mockGetDocs.mockRejectedValue(new Error('Firestore error'));
      const result = await service.getFamilyMembers('user-123');
      expect(result).toEqual([]);
    });
  });

  describe('addFamilyMember', () => {
    it('throws error if uid is not provided', async () => {
      await expect(
        service.addFamilyMember('', { name: 'João', relationship: 'sibling' }),
      ).rejects.toThrow('User ID is required');
    });

    it('saves family member to Firestore subcollection and returns member', async () => {
      mocks.mockCollection.mockReturnValue('family-col-ref' as any);
      mocks.mockAddDoc.mockResolvedValue({ id: 'new-fam-id' });

      const newMember = await service.addFamilyMember('user-123', {
        name: 'Carlos',
        relationship: 'parent',
        phone: '11999991111',
      });

      expect(mocks.mockCollection).toHaveBeenCalledWith(mockFirestore, 'users/user-123/family');
      expect(mocks.mockAddDoc).toHaveBeenCalledWith(
        'family-col-ref',
        expect.objectContaining({
          name: 'Carlos',
          relationship: 'parent',
          phone: '11999991111',
        }),
      );
      expect(newMember.id).toBe('new-fam-id');
      expect(newMember.name).toBe('Carlos');
      expect(newMember.relationship).toBe('parent');
      expect(newMember.createdAt).toBeDefined();
    });
  });

  describe('deleteFamilyMember', () => {
    it('does nothing if uid or memberId is empty', async () => {
      await service.deleteFamilyMember('', 'fam-1');
      await service.deleteFamilyMember('user-123', '');
      expect(mocks.mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('deletes document at users/{uid}/family/{memberId}', async () => {
      mocks.mockDoc.mockReturnValue('doc-to-delete' as any);
      mocks.mockDeleteDoc.mockResolvedValue(undefined);

      await service.deleteFamilyMember('user-123', 'fam-1');

      expect(mocks.mockDoc).toHaveBeenCalledWith(mockFirestore, 'users/user-123/family/fam-1');
      expect(mocks.mockDeleteDoc).toHaveBeenCalledWith('doc-to-delete');
    });
  });
});
