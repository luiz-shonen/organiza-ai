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
    const [path, entry] = gateway.batchOps.set.mock.calls[0];
    expect(path).toBe('events/evt-1/secretSantaParticipants/mock-new-doc-id');
    expect(entry).toEqual(
      expect.objectContaining({ name: 'Ana', giftOptions: ['Livro'], guestId: 'g1' }),
    );
    // The one list everyone reads never holds a phone, and there is no second list to keep.
    expect(entry).not.toHaveProperty('phone');
    expect(gateway.batchOps.set).not.toHaveBeenCalledWith(
      expect.stringContaining('secretSantaRoster'),
      expect.anything(),
    );
  });

  it('keeps a phone apart from the list, by the same id', async () => {
    await service.addParticipant('evt-1', {
      name: 'Vó',
      phone: '(11) 97777-0000',
      giftOptions: [],
    });
    expect(gateway.batchOps.set).toHaveBeenCalledWith(
      'events/evt-1/secretSantaPhones/mock-new-doc-id',
      { phone: '(11) 97777-0000' },
    );
  });

  it('lists participants with the phones kept apart', () => {
    gateway.collectionSnapshot.mockImplementation((path: string) =>
      of(
        path.endsWith('secretSantaPhones')
          ? [{ id: 'a', phone: '(11) 97777-0000' }]
          : [{ id: 'a', name: 'A', giftOptions: [], createdAt: '1' }],
      ),
    );
    let phones: string[] = [];
    service.listParticipants('evt-1').subscribe((list) => (phones = list.map((p) => p.phone)));
    expect(phones).toEqual(['(11) 97777-0000']);
  });

  it('draws: one secret reveal per participant and the links for the owner', async () => {
    const draw = await service.draw(event, people, null);

    const sets = gateway.batchOps.set.mock.calls;
    const reveals = sets.filter(
      ([path]) => path.startsWith('secretSantaReveals/') && !path.includes('/private/'),
    );
    expect(reveals).toHaveLength(3);
    // Without an account, each link keeps its result apart, for "Gerar novo link".
    expect(sets.filter(([path]) => path.endsWith('/private/result'))).toHaveLength(3);
    const pairs = reveals.map(([, data]) => data as SecretSantaReveal);
    // By id only: names, ideas and the event are read when the link is shown.
    expect(pairs.every((r) => r.giverId !== r.receiverId)).toBe(true);
    expect(new Set(pairs.map((r) => r.receiverId)).size).toBe(3);
    expect(pairs.every((r) => r.eventId === 'evt-1' && !('receiverName' in r))).toBe(true);
    expect(pairs.every((r) => !('eventTitle' in r) && !('giverName' in r))).toBe(true);

    expect(sets).toContainEqual(['events/evt-1/secretSanta/draw', draw]);
    expect(draw.participantIds).toEqual(['p1', 'p2', 'p3']);
    expect(new Set(draw.links.map((l) => l.token)).size).toBe(3);
    // The draw the owner reads holds links, never who drew whom.
    // The draw the owner reads holds links and receiver ids, never the receivers' names.
    for (const link of draw.links) {
      // No name or phone written in: the card reads them from the list.
      expect(people.some((p) => JSON.stringify(link).includes(p.name))).toBe(false);
      expect(link).not.toHaveProperty('phone');
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
      expect.objectContaining({ giverId: 'p2', receiverId: drawnByLuiz.id }),
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
      receiverId: '',
    });
    // A link of an older draw had the name written in: that is what is erased.
    await service.openReveal('old', false, false);
    expect(gateway.updateDoc).toHaveBeenCalledWith('secretSantaReveals/old', {
      openedAt: expect.any(String),
      receiverName: '',
      receiverGiftOptions: [],
    });
  });

  it('shows a link by id with the names, ideas and event read now', async () => {
    gateway.getDocWithId.mockImplementation(async (path: string) =>
      path.endsWith('/p1')
        ? { id: 'p1', name: 'Vó Lurdes', giftOptions: [] }
        : { id: 'rsvp_u2', joinedBy: 'u2', giftOptions: ['Livro'] },
    );
    gateway.getDoc.mockResolvedValue({ title: 'Natal 2026', date: '2026-12-24' });
    gateway.collectionSnapshot.mockReturnValue(of([{ id: 'u2', name: 'Jéssica Lima' }]));

    const shown = await service.describeReveal({
      eventId: 'evt-1',
      giverId: 'p1',
      receiverId: 'rsvp_u2',
      createdAt: '1',
    });

    expect(shown).toEqual(
      expect.objectContaining({
        eventTitle: 'Natal 2026',
        giverName: 'Vó Lurdes',
        // An account is named by its profile now, not by what the list once had.
        receiverName: 'Jéssica Lima',
        receiverGiftOptions: ['Livro'],
      }),
    );
  });

  it('drawing again removes the old links', async () => {
    const first = await service.draw(event, people, null);
    gateway.batchOps.delete.mockClear();
    const second = await service.draw(event, people, first);
    expect(gateway.batchOps.delete.mock.calls.map(([path]) => path)).toEqual(
      first.links.flatMap((l) => [
        `secretSantaReveals/${l.token}`,
        `secretSantaReveals/${l.token}/private/result`,
      ]),
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

  it('makes one new link with the same person after the newest one was spent', async () => {
    const docs: Record<string, unknown> = {
      'secretSantaReveals/t1': {
        eventId: 'evt-1',
        eventTitle: 'Natal 2026',
        eventDate: event.date,
        giverName: 'Ana',
        receiverName: '',
        receiverGiftOptions: [],
        createdAt: '1',
        openedAt: '2',
        replacedBy: 't2',
      },
      'secretSantaReveals/t2': {
        eventId: 'evt-1',
        eventTitle: 'Natal 2026',
        eventDate: event.date,
        giverName: 'Ana',
        receiverName: '',
        receiverGiftOptions: [],
        createdAt: '3',
        openedAt: '4',
        replaces: 't1',
      },
      'secretSantaReveals/t2/private/result': {
        eventId: 'evt-1',
        receiverName: 'Bruno',
        receiverGiftOptions: ['Livro'],
      },
    };
    gateway.getDoc.mockImplementation(async (path: string) => docs[path] ?? null);
    gateway.runBatch.mockImplementation(async (fn) => {
      await fn(gateway.batchOps);
    });

    const fresh = await service.renewLink('t1');

    expect(fresh).not.toBe('t2');
    expect(gateway.batchOps.set).toHaveBeenCalledWith(
      `secretSantaReveals/${fresh}`,
      expect.objectContaining({ receiverName: 'Bruno', giverName: 'Ana', replaces: 't2' }),
    );
    expect(gateway.batchOps.update).toHaveBeenCalledWith('secretSantaReveals/t2', {
      replacedBy: fresh,
    });
  });

  it('just opens the newest link when it was not opened yet', async () => {
    gateway.getDoc.mockImplementation(async (path: string) =>
      path === 'secretSantaReveals/t1' ? { receiverName: 'Bruno' } : null,
    );
    expect(await service.renewLink('t1')).toBe('t1');
    expect(gateway.runBatch).not.toHaveBeenCalled();
  });
});
