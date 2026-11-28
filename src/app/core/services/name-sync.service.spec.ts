import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FirestoreGateway } from './firestore.gateway';
import { NameSyncService } from './name-sync.service';
import { SecretSantaService } from './secret-santa.service';

describe('NameSyncService', () => {
  const docs: Record<string, unknown> = {};
  const gateway = {
    getDoc: vi.fn(async (path: string) => docs[path] ?? null),
    updateDoc: vi.fn().mockResolvedValue(undefined),
  };
  const secretSanta = {
    getOwnEntries: vi.fn(),
    saveOwnEntries: vi.fn().mockResolvedValue(undefined),
  };
  let service: NameSyncService;

  beforeEach(() => {
    for (const key of Object.keys(docs)) delete docs[key];
    gateway.getDoc.mockClear();
    gateway.updateDoc.mockClear();
    secretSanta.getOwnEntries.mockReset().mockResolvedValue([]);
    secretSanta.saveOwnEntries.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: FirestoreGateway, useValue: gateway },
        { provide: SecretSantaService, useValue: secretSanta },
      ],
    });
    service = TestBed.inject(NameSyncService);
  });

  it('renames a relative in every event the household answered', async () => {
    docs['users/u1'] = { rsvpEvents: ['e1', 'e2'] };
    docs['events/e1/guests/u1_m1'] = { name: 'Carlinhos' };
    docs['events/e1/claims/u1'] = {
      name: 'Ana',
      entries: [
        { itemId: 'i1', memberId: 'm1', who: 'Carlinhos', quantity: 1, bought: false },
        { itemId: 'i2', memberId: null, who: 'Ana', quantity: 1, bought: false },
      ],
    };
    secretSanta.getOwnEntries.mockImplementation(async (eventId: string) =>
      eventId === 'e1'
        ? [{ id: 'rsvp_u1_f_m1', name: 'Carlinhos', phone: '', giftOptions: ['Bola'] }]
        : [],
    );

    await service.syncFamilyMemberName('u1', 'm1', 'Carlos Eduardo');

    expect(gateway.updateDoc).toHaveBeenCalledWith('events/e1/guests/u1_m1', {
      name: 'Carlos Eduardo',
    });
    expect(gateway.updateDoc).toHaveBeenCalledWith(
      'events/e1/claims/u1',
      expect.objectContaining({
        entries: [
          expect.objectContaining({ memberId: 'm1', who: 'Carlos Eduardo' }),
          expect.objectContaining({ memberId: null, who: 'Ana' }),
        ],
      }),
    );
    expect(secretSanta.saveOwnEntries).toHaveBeenCalledWith(
      'e1',
      'u1',
      [
        {
          id: 'rsvp_u1_f_m1',
          input: { name: 'Carlos Eduardo', phone: '', giftOptions: ['Bola'] },
        },
      ],
      [],
      ['rsvp_u1_f_m1'],
    );
    // e2: nothing of this relative there, nothing written.
    expect(gateway.updateDoc).not.toHaveBeenCalledWith(
      expect.stringContaining('events/e2'),
      expect.anything(),
    );
  });
});
