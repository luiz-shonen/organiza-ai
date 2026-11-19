import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { GuestService } from './guest.service';
import { SecretSantaService } from './secret-santa.service';
import { FirestoreGateway } from './firestore.gateway';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';
import type { SecretSantaParticipant, SecretSantaReveal } from '../models';

/** "Aprovar quem confirma pelo link", and the amigo oculto links tied to an account. */
describe('Approval and account-only links', () => {
  let gateway: MockFirestoreGateway;

  beforeEach(() => {
    gateway = createMockFirestoreGateway();
    TestBed.configureTestingModule({
      providers: [
        GuestService,
        SecretSantaService,
        { provide: FirestoreGateway, useValue: gateway },
      ],
    });
  });

  it('saves a first answer to an event that asks for approval as waiting', async () => {
    const guests = TestBed.inject(GuestService);
    await guests.batchConfirmRsvp('evt-1', { uid: 'u1', name: 'Maria', pendingApproval: true });
    expect(gateway.batchOps.set.mock.calls[0][1]).toEqual(
      expect.objectContaining({ uid: 'u1', approved: false }),
    );

    gateway.batchOps.set.mockClear();
    await guests.batchConfirmRsvp('evt-1', { uid: 'u1', name: 'Maria' });
    expect(gateway.batchOps.set.mock.calls[0][1]).not.toHaveProperty('approved');
  });

  it('approves, and refuses with the relatives and amigo oculto entries', async () => {
    const guests = TestBed.inject(GuestService);
    await guests.approveGuest('evt-1', 'u1');
    expect(gateway.updateDoc).toHaveBeenCalledWith('events/evt-1/guests/u1', { approved: true });

    await guests.refuseGuest('evt-1', 'u1', ['u1_ana'], ['rsvp_u1']);
    expect(gateway.batchOps.delete.mock.calls.map(([path]) => path)).toEqual([
      'events/evt-1/guests/u1',
      'events/evt-1/guests/u1_ana',
      'events/evt-1/secretSantaParticipants/rsvp_u1',
    ]);
  });

  it('ties each reveal to the giver account, when there is one', async () => {
    const santa = TestBed.inject(SecretSantaService);
    const people: SecretSantaParticipant[] = ['a', 'b', 'c'].map((id) => ({
      id,
      name: id.toUpperCase(),
      phone: '',
      giftOptions: [],
    }));
    const draw = await santa.draw(
      { id: 'evt-1', title: 'Natal', date: '2026-12-24T20:00:00.000Z' },
      people,
      null,
      { a: 'uid-a' },
    );
    const reveals = gateway.batchOps.set.mock.calls.filter(([path]) =>
      String(path).startsWith('secretSantaReveals/'),
    );
    const byToken = new Map(reveals.map(([path, data]) => [String(path).split('/')[1], data]));
    for (const link of draw.links) {
      const reveal = byToken.get(link.token) as SecretSantaReveal;
      if (link.participantId === 'a') expect(reveal.giverUid).toBe('uid-a');
      else expect(reveal).not.toHaveProperty('giverUid');
    }
  });
});
