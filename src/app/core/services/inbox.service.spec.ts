import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { InboxService } from './inbox.service';
import { FirestoreGateway } from './firestore.gateway';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';
import type { AppNotification } from '../models';

describe('InboxService', () => {
  let service: InboxService;
  let gateway: MockFirestoreGateway;

  beforeEach(() => {
    gateway = createMockFirestoreGateway();
    TestBed.configureTestingModule({
      providers: [InboxService, { provide: FirestoreGateway, useValue: gateway }],
    });
    service = TestBed.inject(InboxService);
  });

  it('lists only new notifications, most recent first', () => {
    gateway.collectionSnapshot.mockReturnValue(
      of([
        { id: 'a', title: 'Antiga', createdAt: '2026-11-01', readAt: null },
        { id: 'b', title: 'Lida', createdAt: '2026-11-03', readAt: '2026-11-03' },
        { id: 'c', title: 'Nova', createdAt: '2026-11-02', readAt: null },
      ]),
    );
    let titles: string[] = [];
    service.watchUnread('uid-1').subscribe((list) => (titles = list.map((n) => n.title)));
    expect(gateway.collectionSnapshot).toHaveBeenCalledWith('users/uid-1/notifications');
    expect(titles).toEqual(['Nova', 'Antiga']);
  });

  it('marks a notification as read', async () => {
    await service.markRead('uid-1', 'secret-santa_e');
    expect(gateway.updateDoc).toHaveBeenCalledWith('users/uid-1/notifications/secret-santa_e', {
      readAt: expect.any(String),
    });
  });

  it('sends a notification as new, replacing the previous one with the same id', async () => {
    const notice: Omit<AppNotification, 'readAt'> = {
      id: 'secret-santa_e',
      kind: 'secret-santa',
      eventId: 'e',
      eventTitle: 'Natal',
      title: 'Sorteio do amigo oculto feito!',
      body: 'Confira',
      actionLabel: 'Ver quem eu tirei',
      actionUrl: '/amigo-oculto/tok',
      createdAt: '2026-11-16',
    };
    await service.send('uid-1', notice);
    const { id: _id, ...data } = notice;
    expect(gateway.setDoc).toHaveBeenCalledWith('users/uid-1/notifications/secret-santa_e', {
      ...data,
      readAt: null,
    });
  });
});
