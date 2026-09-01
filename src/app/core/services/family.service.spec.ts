import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { FamilyService } from './family.service';
import { FirestoreGateway } from './firestore.gateway';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';

describe('FamilyService', () => {
  let service: FamilyService;
  let mockGateway: MockFirestoreGateway;

  beforeEach(() => {
    mockGateway = createMockFirestoreGateway();

    TestBed.configureTestingModule({
      providers: [
        FamilyService,
        {
          provide: FirestoreGateway,
          useValue: mockGateway,
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
      expect(mockGateway.getDocs).not.toHaveBeenCalled();
    });

    it('fetches and maps family members correctly', async () => {
      const mockDocs = [
        {
          id: 'fam-1',
          name: 'Lucas',
          relationship: 'child' as const,
          phone: '11999999999',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'fam-2',
          name: 'Mariana',
          relationship: 'spouse' as const,
          phone: undefined,
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ];

      mockGateway.getDocs.mockResolvedValue(mockDocs);

      const result = await service.getFamilyMembers('user-123');

      expect(mockGateway.getDocs).toHaveBeenCalledWith('users/user-123/family', expect.anything());
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'fam-1',
        name: 'Lucas',
        relationship: 'child',
        phone: '11999999999',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(result[1]).toEqual({
        id: 'fam-2',
        name: 'Mariana',
        relationship: 'spouse',
        phone: undefined,
        createdAt: '2026-01-02T00:00:00.000Z',
      });
    });

    it('handles Timestamp createdAt properly', async () => {
      mockGateway.timestampToDate.mockReturnValue(new Date('2026-05-10T12:00:00.000Z'));
      mockGateway.getDocs.mockResolvedValue([
        {
          id: 'fam-3',
          name: 'Carla',
          relationship: 'other' as const,
          createdAt: { seconds: 1778414400, nanoseconds: 0 } as any,
        },
      ]);

      const result = await service.getFamilyMembers('user-123');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Carla');
      expect(result[0].createdAt).toBe('2026-05-10T12:00:00.000Z');
    });

    it('returns empty array when getDocs throws error', async () => {
      mockGateway.getDocs.mockRejectedValue(new Error('Firestore error'));

      const result = await service.getFamilyMembers('user-123');
      expect(result).toEqual([]);
    });
  });

  describe('addFamilyMember', () => {
    it('throws error if uid is not provided', async () => {
      await expect(
        service.addFamilyMember('', {
          name: 'Carlos',
          relationship: 'parent',
        }),
      ).rejects.toThrow('User ID is required');
    });

    it('saves family member to Firestore subcollection and returns member', async () => {
      mockGateway.addDoc.mockResolvedValue('new-fam-id');

      const newMember = await service.addFamilyMember('user-123', {
        name: 'Carlos',
        relationship: 'parent',
        phone: '11988887777',
        createdAt: '2026-02-01T10:00:00.000Z',
      });

      expect(mockGateway.addDoc).toHaveBeenCalledWith('users/user-123/family', {
        name: 'Carlos',
        relationship: 'parent',
        phone: '11988887777',
        createdAt: '2026-02-01T10:00:00.000Z',
      });

      expect(newMember).toEqual({
        id: 'new-fam-id',
        name: 'Carlos',
        relationship: 'parent',
        phone: '11988887777',
        createdAt: '2026-02-01T10:00:00.000Z',
      });
    });
  });

  describe('deleteFamilyMember', () => {
    it('does nothing if uid or memberId is empty', async () => {
      await service.deleteFamilyMember('', 'fam-1');
      expect(mockGateway.deleteDoc).not.toHaveBeenCalled();

      await service.deleteFamilyMember('user-123', '');
      expect(mockGateway.deleteDoc).not.toHaveBeenCalled();
    });

    it('deletes document at users/{uid}/family/{memberId}', async () => {
      await service.deleteFamilyMember('user-123', 'fam-1');

      expect(mockGateway.deleteDoc).toHaveBeenCalledWith('users/user-123/family/fam-1');
    });
  });
});
