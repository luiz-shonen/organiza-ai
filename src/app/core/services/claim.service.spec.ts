import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { ClaimService } from './claim.service';
import { FirestoreGateway } from './firestore.gateway';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';

describe('ClaimService', () => {
  let service: ClaimService;
  let gateway: MockFirestoreGateway;

  beforeEach(() => {
    gateway = createMockFirestoreGateway();
    TestBed.configureTestingModule({
      providers: [ClaimService, { provide: FirestoreGateway, useValue: gateway }],
    });
    service = TestBed.inject(ClaimService);
  });

  it('streams the claims of one event', () => {
    gateway.collectionSnapshot.mockReturnValue(of([]));
    service.listClaims('evt-1').subscribe();
    expect(gateway.collectionSnapshot).toHaveBeenCalledWith('events/evt-1/claims');
  });

  it("stores the household's entries under the account holder's uid", async () => {
    const entry = { itemId: 'i1', memberId: null, who: 'Ana', quantity: 2, bought: false };
    await service.saveClaims('evt-1', 'uid-1', [entry]);

    expect(gateway.setDoc).toHaveBeenCalledWith(
      'events/evt-1/claims/uid-1',
      expect.not.objectContaining({ name: expect.anything() }),
    );
    expect(gateway.setDoc).toHaveBeenCalledWith(
      'events/evt-1/claims/uid-1',
      expect.objectContaining({ entries: [entry] }),
    );
  });

  it('removes the document when nothing is left', async () => {
    await service.saveClaims('evt-1', 'uid-1', []);
    expect(gateway.deleteDoc).toHaveBeenCalledWith('events/evt-1/claims/uid-1');
    expect(gateway.setDoc).not.toHaveBeenCalled();
  });
});
