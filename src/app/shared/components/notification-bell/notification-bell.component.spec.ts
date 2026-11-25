import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationBellComponent } from './notification-bell.component';
import {
  AuthService,
  CollaboratorInvitesService,
  EventService,
  InboxService,
  PushService,
  type PushState,
} from '../../../core/services';
import { FeedbackService, type OrgNotificationMenuFooter } from '../../ui';

describe('NotificationBellComponent push line', () => {
  const state = signal<PushState>('off');
  const push = {
    state,
    enable: vi.fn(),
    disable: vi.fn().mockResolvedValue(undefined),
  };
  const feedback = { success: vi.fn(), info: vi.fn(), error: vi.fn() };

  interface BellInternals {
    pushFooter(): OrgNotificationMenuFooter | null;
    togglePush(): Promise<void>;
  }

  function create(): BellInternals {
    TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        { provide: AuthService, useValue: { currentUser: signal(null) } },
        { provide: InboxService, useValue: { watchAll: () => of([]), markRead: vi.fn() } },
        {
          provide: CollaboratorInvitesService,
          useValue: {
            invites: signal([]),
            isSeen: () => true,
            refresh: vi.fn(),
            markSeen: vi.fn(),
          },
        },
        { provide: EventService, useValue: {} },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
        { provide: PushService, useValue: push },
        { provide: FeedbackService, useValue: feedback },
      ],
    });
    return TestBed.createComponent(NotificationBellComponent)
      .componentInstance as unknown as BellInternals;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    state.set('off');
  });

  it('offers, confirms and explains each state in short Portuguese', () => {
    const bell = create();
    expect(bell.pushFooter()?.title).toBe('Ativar notificações no celular');
    state.set('on');
    expect(bell.pushFooter()?.title).toBe('Notificações ativadas');
    state.set('blocked');
    expect(bell.pushFooter()).toEqual(
      expect.objectContaining({ title: 'Notificações bloqueadas', disabled: true }),
    );
    state.set('install');
    expect(bell.pushFooter()).toEqual(
      expect.objectContaining({
        body: 'Adicione o app à Tela de Início para ativar.',
        disabled: true,
      }),
    );
    state.set('unsupported');
    expect(bell.pushFooter()).toBeNull();
  });

  it('turns on with a tap, once even when tapped twice', async () => {
    let finish: (ok: boolean) => void = () => undefined;
    push.enable.mockReturnValue(new Promise<boolean>((resolve) => (finish = resolve)));
    const bell = create();
    const first = bell.togglePush();
    const second = bell.togglePush();
    finish(true);
    await Promise.all([first, second]);
    expect(push.enable).toHaveBeenCalledTimes(1);
    expect(feedback.success).toHaveBeenCalledWith('Pronto! Os avisos chegam neste aparelho.');
  });

  it('turns off, and says why it could not turn on', async () => {
    const bell = create();
    state.set('on');
    await bell.togglePush();
    expect(push.disable).toHaveBeenCalled();
    expect(feedback.info).toHaveBeenCalledWith('Notificações desativadas neste aparelho.');

    state.set('off');
    push.enable.mockImplementation(async () => {
      state.set('blocked');
      return false;
    });
    await bell.togglePush();
    expect(feedback.info).toHaveBeenCalledWith(
      'Notificações bloqueadas. Libere nas configurações do navegador.',
    );

    state.set('off');
    push.enable.mockResolvedValue(false);
    await bell.togglePush();
    expect(feedback.error).toHaveBeenCalled();
  });
});
