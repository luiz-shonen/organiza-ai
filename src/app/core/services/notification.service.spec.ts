import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let notificationConstructorSpy: ReturnType<typeof vi.fn<(title: string, options?: NotificationOptions) => void>>;

  beforeEach(() => {
    notificationConstructorSpy = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function setupNotificationMock(
    permission: NotificationPermission = 'granted',
    requestPermissionResult: NotificationPermission = 'granted'
  ) {
    const mockNotificationClass = class {
      static permission: NotificationPermission = permission;
      static requestPermission = vi.fn().mockResolvedValue(requestPermissionResult);

      constructor(title: string, options?: NotificationOptions) {
        notificationConstructorSpy(title, options);
      }
    };

    vi.stubGlobal('Notification', mockNotificationClass);
  }

  function createService(): NotificationService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });
    return TestBed.inject(NotificationService);
  }

  it('should initialize and enable permissions when Notification.permission is granted', () => {
    setupNotificationMock('granted');
    const service = createService();

    service.sendLocalNotification('Lembrete', 'O evento começa amanhã');

    expect(notificationConstructorSpy).toHaveBeenCalledWith(
      'Lembrete',
      expect.objectContaining({
        body: 'O evento começa amanhã',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
      })
    );
  });

  it('should request permission when permission is default and enable notifications upon grant', async () => {
    setupNotificationMock('default', 'granted');
    const service = createService();

    // Allow promise in constructor checkPermission to resolve
    await Promise.resolve();

    service.sendLocalNotification('Confirmação', 'Sua presença foi confirmada', '/custom/icon.png');

    expect(notificationConstructorSpy).toHaveBeenCalledWith(
      'Confirmação',
      expect.objectContaining({
        body: 'Sua presença foi confirmada',
        icon: '/custom/icon.png',
      })
    );
  });

  it('should not dispatch notification when permission is denied', async () => {
    setupNotificationMock('denied');
    const service = createService();

    await Promise.resolve();

    service.sendLocalNotification('Não deve disparar', 'Corpo');

    expect(notificationConstructorSpy).not.toHaveBeenCalled();
  });

  it('should safely catch errors during notification construction', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const throwingNotificationClass = class {
      static permission: NotificationPermission = 'granted';
      static requestPermission = vi.fn().mockResolvedValue('granted');

      constructor() {
        throw new Error('Notification creation error');
      }
    };
    vi.stubGlobal('Notification', throwingNotificationClass);

    const service = createService();
    expect(() => service.sendLocalNotification('Erro', 'Teste')).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });
});
