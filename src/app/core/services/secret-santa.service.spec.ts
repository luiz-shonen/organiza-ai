import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { SecretSantaService } from './secret-santa.service';
import { FirestoreGateway } from './firestore.gateway';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';
import type { SecretSantaParticipant, SecretSantaReveal } from '../models';

describe('SecretSantaService', () => {
  let service: SecretSantaService;
  let gateway: MockFirestoreGateway;

  const people: SecretSantaParticipant[] = [
    { id: 'p1', name: 'Jéssica', phone: '(11) 98888-1111', giftOptions: ['Chinelo verde, 36'] },
    { id: 'p2', name: 'Luiz', phone: '', giftOptions: [] },
    { id: 'p3', name: 'Ana', phone: '', giftOptions: ['Livro'] },
  ];
  const event = { id: 'evt-1', title: 'Natal 2026', date: '2026-12-24T20:00:00.000Z' };

  beforeEach(() => {
    gateway = createMockFirestoreGateway();
    TestBed.configureTestingModule({
      providers: [SecretSantaService, { provide: FirestoreGateway, useValue: gateway }],
    });
    service = TestBed.inject(SecretSantaService);
  });

  it('lists participants in the order they were added', () => {
    gateway.collectionSnapshot.mockReturnValue(
      of([
        { id: 'b', name: 'B', phone: '', createdAt: '2026-11-02' },
        { id: 'a', name: 'A', phone: '', giftOptions: ['x'], createdAt: '2026-11-01' },
      ]),
    );
    let names: string[] = [];
    service.listParticipants('evt-1').subscribe((list) => (names = list.map((p) => p.name)));
    expect(gateway.collectionSnapshot).toHaveBeenCalledWith('events/evt-1/secretSantaParticipants');
    expect(names).toEqual(['A', 'B']);
  });

  it('adds a participant with name, phone and gift options', async () => {
    await service.addParticipant('evt-1', {
      name: 'Ana',
      phone: '',
      giftOptions: ['Livro'],
      guestId: 'g1',
    });
    expect(gateway.batchOps.set).toHaveBeenCalledWith(
      'events/evt-1/secretSantaParticipants/mock-new-doc-id',
      expect.objectContaining({ name: 'Ana', phone: '', giftOptions: ['Livro'], guestId: 'g1' }),
    );
    // The guests' roster gets the same person, without the phone, in the same batch.
    expect(gateway.batchOps.set).toHaveBeenCalledWith(
      'events/evt-1/secretSantaRoster/mock-new-doc-id',
      { name: 'Ana', giftOptions: ['Livro'], createdAt: expect.any(String) },
    );
  });

  it('syncs the guests roster one entry at a time: a refused one keeps no one else out', async () => {
    gateway.getDocsFromServer.mockImplementation(async (path: string) =>
      path.endsWith('secretSantaParticipants')
        ? people
        : [{ id: 'p2', name: 'Luiz', giftOptions: [], createdAt: '2026-11-01' }],
    );
    let calls = 0;
    gateway.runBatch.mockImplementation(async (fn) => {
      calls++;
      if (calls === 1) throw new Error('permission-denied');
      await fn(gateway.batchOps);
    });

    await service.syncRoster('evt-1');

    expect(gateway.runBatch).toHaveBeenCalledTimes(2);
    expect(gateway.batchOps.set).toHaveBeenCalledWith(
      'events/evt-1/secretSantaRoster/p3',
      { name: 'Ana', giftOptions: ['Livro'], note: '', createdAt: expect.any(String) },
      { merge: true },
    );
  });

  it('syncs from the server, not the cache: no copy leaves while its entry still exists', async () => {
    // The listener's first answer may hold only the cached entry; the server has everyone.
    gateway.collectionSnapshot.mockReturnValue(of([people[1]]));
    gateway.getDocsFromServer.mockImplementation(async (path: string) =>
      path.endsWith('secretSantaParticipants')
        ? people
        : people.map(({ id, name, giftOptions }) => ({ id, name, giftOptions })),
    );

    await service.syncRoster('evt-1');

    expect(gateway.batchOps.delete).not.toHaveBeenCalled();
    expect(gateway.batchOps.set).not.toHaveBeenCalled();
  });

  it('drops the copy of an entry that left the list', async () => {
    gateway.getDocsFromServer.mockImplementation(async (path: string) =>
      path.endsWith('secretSantaParticipants')
        ? people.slice(0, 2)
        : people.map(({ id, name, giftOptions }) => ({ id, name, giftOptions })),
    );

    await service.syncRoster('evt-1');

    expect(gateway.batchOps.delete).toHaveBeenCalledTimes(1);
    expect(gateway.batchOps.delete).toHaveBeenCalledWith('events/evt-1/secretSantaRoster/p3');
  });

  it('draws: one secret reveal per participant and the links for the owner', async () => {
    const draw = await service.draw(event, people, null);

    const sets = gateway.batchOps.set.mock.calls;
    const reveals = sets.filter(([path]) => path.startsWith('secretSantaReveals/'));
    expect(reveals).toHaveLength(3);
    const pairs = reveals.map(([, data]) => data as SecretSantaReveal);
    expect(pairs.every((r) => r.giverName !== r.receiverName)).toBe(true);
    expect(new Set(pairs.map((r) => r.receiverName)).size).toBe(3);
    expect(pairs.find((r) => r.receiverName === 'Jéssica')?.receiverGiftOptions).toEqual([
      'Chinelo verde, 36',
    ]);
    expect(pairs.every((r) => r.eventId === 'evt-1' && r.eventTitle === 'Natal 2026')).toBe(true);

    expect(sets).toContainEqual(['events/evt-1/secretSanta/draw', draw]);
    expect(draw.participantIds).toEqual(['p1', 'p2', 'p3']);
    expect(new Set(draw.links.map((l) => l.token)).size).toBe(3);
    // The draw the owner reads holds links, never who drew whom.
    // The draw the owner reads holds links and receiver ids, never the receivers' names.
    for (const link of draw.links) {
      const others = people.filter((p) => p.id !== link.participantId).map((p) => p.name);
      expect(others.some((name) => JSON.stringify(link).includes(name))).toBe(false);
      expect(link.receiverId).not.toBe(link.participantId);
      expect(link.token).toMatch(/^[0-9a-f-]{36}$/);
    }
  });

  it('sends a new link to one person, with the same person drawn, and drops the old one', async () => {
    const draw = await service.draw(event, people, null);
    const old = draw.links.find((l) => l.participantId === 'p2')!;
    const drawnByLuiz = people.find((p) => p.id === old.receiverId)!;
    gateway.batchOps.set.mockClear();
    gateway.batchOps.delete.mockClear();

    const next = await service.resendLink(event, draw, 'p2', people);

    const fresh = next.links.find((l) => l.participantId === 'p2')!;
    expect(fresh.token).not.toBe(old.token);
    expect(fresh.receiverId).toBe(old.receiverId);
    expect(gateway.batchOps.delete).toHaveBeenCalledWith(`secretSantaReveals/${old.token}`);
    expect(gateway.batchOps.set).toHaveBeenCalledWith(
      `secretSantaReveals/${fresh.token}`,
      expect.objectContaining({ giverName: 'Luiz', receiverName: drawnByLuiz.name }),
    );
    expect(gateway.batchOps.set).toHaveBeenCalledWith('events/evt-1/secretSanta/draw', next);
    // Everyone else keeps their link.
    expect(next.links.filter((l) => l.participantId !== 'p2')).toEqual(
      draw.links.filter((l) => l.participantId !== 'p2'),
    );
  });

  it('refuses a new link when the person drawn left the list', async () => {
    const draw = await service.draw(event, people, null);
    const link = draw.links.find((l) => l.participantId === 'p2')!;
    const left = people.filter((p) => p.id !== link.receiverId);
    await expect(service.resendLink(event, draw, 'p2', left)).rejects.toThrow();
  });

  it('opening spends the link: stamps the date and erases whom they drew', async () => {
    await service.openReveal('tok');
    expect(gateway.updateDoc).toHaveBeenCalledWith('secretSantaReveals/tok', {
      openedAt: expect.any(String),
      receiverName: '',
      receiverGiftOptions: [],
    });
  });

  it('drawing again removes the old links', async () => {
    const first = await service.draw(event, people, null);
    gateway.batchOps.delete.mockClear();
    const second = await service.draw(event, people, first);
    expect(gateway.batchOps.delete.mock.calls.map(([path]) => path)).toEqual(
      first.links.map((l) => `secretSantaReveals/${l.token}`),
    );
    expect(second.links.map((l) => l.token)).not.toEqual(first.links.map((l) => l.token));
  });

  it('reads a reveal by its token', async () => {
    gateway.getDoc.mockResolvedValue({ giverName: 'Ana' });
    await expect(service.getReveal('tok')).resolves.toEqual({ giverName: 'Ana' });
    expect(gateway.getDoc).toHaveBeenCalledWith('secretSantaReveals/tok');
  });

  it('tells participants with an account in the app, pointing to their own link', async () => {
    const draw = await service.draw(event, people, null, { p1: 'jessica-uid' });

    const link = draw.links.find((l) => l.participantId === 'p1')!;
    expect(link.uid).toBe('jessica-uid');
    expect(draw.links.filter((l) => l.uid)).toHaveLength(1);
    expect(gateway.setDoc).toHaveBeenCalledTimes(1);
    expect(gateway.setDoc).toHaveBeenCalledWith(
      'users/jessica-uid/notifications/secret-santa_evt-1',
      expect.objectContaining({
        kind: 'secret-santa',
        title: 'Sorteio do amigo oculto feito!',
        actionLabel: 'Ver quem eu tirei',
        actionUrl: `/amigo-oculto/${link.token}`,
        readAt: null,
      }),
    );
  });

  it('still draws when the notice cannot be saved: WhatsApp stays the main way', async () => {
    gateway.setDoc.mockRejectedValue(new Error('permission-denied'));
    await expect(service.draw(event, people, null, { p1: 'jessica-uid' })).resolves.toBeTruthy();
  });

  it('a new link replaces the notice with "Seu novo link"', async () => {
    const draw = await service.draw(event, people, null, { p1: 'jessica-uid' });
    gateway.setDoc.mockClear();
    const next = await service.resendLink(event, draw, 'p1', people);
    const fresh = next.links.find((l) => l.participantId === 'p1')!;
    expect(fresh.uid).toBe('jessica-uid');
    expect(gateway.setDoc).toHaveBeenCalledWith(
      'users/jessica-uid/notifications/secret-santa_evt-1',
      expect.objectContaining({
        title: 'Seu novo link do amigo oculto',
        actionUrl: `/amigo-oculto/${fresh.token}`,
      }),
    );
  });
});
