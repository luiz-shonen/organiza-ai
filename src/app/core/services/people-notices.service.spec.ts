import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PeopleNoticesService } from './people-notices.service';
import { AuthService } from './auth.service';
import { EventService } from './event.service';
import { InboxService } from './inbox.service';
import { PushService } from './push.service';

describe('PeopleNoticesService', () => {
  let service: PeopleNoticesService;
  const me = signal<{ uid: string; displayName: string } | null>({
    uid: 'ana',
    displayName: 'Ana Souza',
  });
  const inbox = { send: vi.fn().mockResolvedValue(undefined) };
  const push = { notify: vi.fn() };
  const events = {
    getEventById: vi.fn().mockResolvedValue({
      id: 'e1',
      title: 'Natal 2026',
      createdBy: 'jessica',
      collaborators: ['bia', 'ana'],
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    me.set({ uid: 'ana', displayName: 'Ana Souza' });
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { currentUser: me } },
        { provide: InboxService, useValue: inbox },
        { provide: PushService, useValue: push },
        { provide: EventService, useValue: events },
      ],
    });
    service = TestBed.inject(PeopleNoticesService);
  });

  it('tells each person who organizes, but not the one who answered, and pushes it', async () => {
    await service.presence('e1', 'Ana', { kind: 'confirmed', companions: 2, relatives: 1 });

    expect(inbox.send.mock.calls.map(([uid]) => uid)).toEqual(['jessica', 'bia']);
    expect(inbox.send).toHaveBeenCalledWith(
      'jessica',
      expect.objectContaining({
        id: 'presence_e1_ana',
        kind: 'presence',
        title: 'Ana confirmou presença',
        body: 'Natal 2026 · com 1 familiar e 2 acompanhantes',
        actionUrl: '/evento/e1',
        actorUid: 'ana',
        actorName: 'Ana Souza',
      }),
    );
    expect(push.notify).toHaveBeenCalledWith('users/jessica/notifications/presence_e1_ana');
    expect(push.notify).toHaveBeenCalledWith('users/bia/notifications/presence_e1_ana');
  });

  it('writes each answer in Portuguese', () => {
    const text = PeopleNoticesService.presenceText;
    expect(text('Ana', { kind: 'pending', companions: 0, relatives: 0 })).toEqual({
      title: 'Ana quer confirmar presença',
      body: 'Aguardando sua aprovação',
    });
    expect(text('Ana', { kind: 'edited', companions: 1, relatives: 0 }).body).toBe(
      'com 1 acompanhante',
    );
    expect(text('Ana', { kind: 'declined', message: 'Estarei viajando' })).toEqual({
      title: 'Ana não poderá ir',
      body: '“Estarei viajando”',
    });
    expect(text('Ana', { kind: 'cancelled', message: '' }).title).toBe('Ana cancelou a presença');
  });

  it('tells the owner when a collaborator leaves', async () => {
    me.set({ uid: 'bia', displayName: 'Bia' });
    await service.collaboration('e1', 'Bia', false);
    expect(inbox.send).toHaveBeenCalledWith(
      'jessica',
      expect.objectContaining({
        id: 'collaboration_e1_bia',
        kind: 'collaboration',
        title: 'Bia saiu da colaboração',
      }),
    );
    expect(inbox.send.mock.calls.map(([uid]) => uid)).toEqual(['jessica', 'ana']);
  });

  it('tells the guest their presence was let in', async () => {
    me.set({ uid: 'jessica', displayName: 'Jéssica' });
    await service.approved({ id: 'e1', title: 'Natal 2026' }, 'ana');
    expect(inbox.send).toHaveBeenCalledWith(
      'ana',
      expect.objectContaining({
        id: 'approval_e1',
        kind: 'approval',
        title: 'Sua presença foi aprovada',
        actorUid: 'jessica',
      }),
    );
    expect(push.notify).toHaveBeenCalledWith('users/ana/notifications/approval_e1');
  });

  it('pushes an invite to help organise by the invited e-mail', () => {
    service.collaboratorInvited('e1', ' Ana@Test.com ');
    expect(push.notify).toHaveBeenCalledWith('events/e1/invitations/ana@test.com');
  });

  it('keeps markup out of what the rules check, and never fails the action', async () => {
    inbox.send.mockRejectedValueOnce(new Error('denied'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(
      service.presence('e1', '<Ana>', { kind: 'confirmed', companions: 0, relatives: 0 }),
    ).resolves.toBeUndefined();
    expect(inbox.send.mock.calls[1][1].title).toBe('Ana confirmou presença');
  });

  it('does nothing when signed out', async () => {
    me.set(null);
    await service.presence('e1', 'Ana', { kind: 'confirmed', companions: 0, relatives: 0 });
    expect(inbox.send).not.toHaveBeenCalled();
  });
});
