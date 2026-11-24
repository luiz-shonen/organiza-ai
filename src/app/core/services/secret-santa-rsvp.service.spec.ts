import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SecretSantaService } from './secret-santa.service';
import { FirestoreGateway } from './firestore.gateway';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';
import type { SecretSantaParticipant } from '../models';

/** Joining from the invite, and the organizer's side of it. */
describe('SecretSantaService (invite sign-ups)', () => {
  let service: SecretSantaService;
  let gateway: MockFirestoreGateway;
  const path = 'events/evt-1/secretSantaParticipants';

  beforeEach(() => {
    gateway = createMockFirestoreGateway();
    TestBed.configureTestingModule({
      providers: [SecretSantaService, { provide: FirestoreGateway, useValue: gateway }],
    });
    service = TestBed.inject(SecretSantaService);
  });

  it('reads only the entries asked for, skipping missing ones', async () => {
    gateway.getDocWithId.mockImplementation(async (p: string) =>
      p.endsWith('rsvp_u1')
        ? { id: 'rsvp_u1', name: 'Maria', phone: '', giftOptions: ['Livro'], joinedBy: 'u1' }
        : null,
    );
    const entries = await service.getOwnEntries('evt-1', ['rsvp_u1', 'rsvp_u1_f_ana']);
    expect(entries).toEqual([
      { id: 'rsvp_u1', name: 'Maria', phone: '', giftOptions: ['Livro'], joinedBy: 'u1' },
    ]);
  });

  it('saves the guest entries under their ids, new ones dated, and removes the rest', async () => {
    await service.saveOwnEntries(
      'evt-1',
      'u1',
      [
        { id: 'rsvp_u1', input: { name: 'Maria', phone: '', giftOptions: [], guestId: 'u1' } },
        { id: 'rsvp_u1_f_ana', input: { name: 'Ana', phone: '', giftOptions: [] } },
      ],
      ['rsvp_u1_c_bia'],
      ['rsvp_u1'],
    );
    const sets = gateway.batchOps.set.mock.calls;
    expect(sets[0]).toEqual([
      `${path}/rsvp_u1`,
      { name: 'Maria', phone: '', giftOptions: [], guestId: 'u1', joinedBy: 'u1' },
      { merge: true },
    ]);
    // Each entry and its roster copy (name and gift options only) go in the same batch.
    expect(sets[1]).toEqual([
      'events/evt-1/secretSantaRoster/rsvp_u1',
      { name: 'Maria', giftOptions: [] },
      { merge: true },
    ]);
    expect(sets[2][1]).toEqual(
      expect.objectContaining({ joinedBy: 'u1', createdAt: expect.any(String) }),
    );
    expect(gateway.batchOps.delete).toHaveBeenCalledWith(`${path}/rsvp_u1_c_bia`);
    expect(gateway.batchOps.delete).toHaveBeenCalledWith(
      'events/evt-1/secretSantaRoster/rsvp_u1_c_bia',
    );
  });

  it('merges a duplicate into the entry from the invite, keeping the guest own entry', async () => {
    const keep: SecretSantaParticipant = {
      id: 'rsvp_u1',
      name: 'Jéssica Melo',
      phone: '',
      giftOptions: [],
      joinedBy: 'u1',
    };
    const drop: SecretSantaParticipant = {
      id: 'm1',
      name: 'Jéssica',
      phone: '(11) 98888-1111',
      giftOptions: ['Livro'],
    };
    await service.mergeDuplicate('evt-1', { keep, drop, sure: true });
    // The guest's entry stays as they made it.
    expect(gateway.batchOps.update).not.toHaveBeenCalled();
    expect(gateway.batchOps.delete).toHaveBeenCalledWith(`${path}/m1`);
  });

  it('remembers two people with the same name are different', async () => {
    await service.markDistinct('evt-1', {
      keep: { id: 'rsvp_u1', name: 'Ana', phone: '', giftOptions: [], distinctFrom: ['x'] },
      drop: { id: 'm1', name: 'Ana', phone: '', giftOptions: [] },
      sure: false,
    });
    expect(gateway.updateDoc).toHaveBeenCalledWith(`${path}/rsvp_u1`, {
      distinctFrom: ['x', 'm1'],
    });
  });

  it('closes the sign-ups, keeping the other settings', async () => {
    await service.setSelfJoin(
      'evt-1',
      { enabled: true, giftOptions: true, maxGiftOptions: 2 },
      false,
    );
    expect(gateway.updateDoc).toHaveBeenCalledWith('events/evt-1', {
      secretSanta: { enabled: true, giftOptions: true, maxGiftOptions: 2, selfJoin: false },
      updatedAt: expect.any(String),
    });
  });
});
