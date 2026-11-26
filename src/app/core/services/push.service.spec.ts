import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PushService } from './push.service';
import { AuthService } from './auth.service';

const RELAY = 'https://organizaai-push.test.workers.dev';

describe('PushService', () => {
  let subscription: BehaviorSubject<PushSubscription | null>;
  let swPush: {
    isEnabled: boolean;
    subscription: BehaviorSubject<PushSubscription | null>;
    requestSubscription: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
  };
  let fetchSpy: ReturnType<typeof vi.fn>;
  const user = { uid: 'jessica', getIdToken: vi.fn().mockResolvedValue('id-token') };

  function setPermission(permission: NotificationPermission) {
    vi.stubGlobal('Notification', { permission });
  }

  function create(options: { swPush?: boolean } = {}): PushService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { currentUser: signal(user) } },
        ...(options.swPush === false ? [] : [{ provide: SwPush, useValue: swPush }]),
      ],
    });
    return TestBed.inject(PushService);
  }

  beforeEach(() => {
    subscription = new BehaviorSubject<PushSubscription | null>(null);
    const fresh = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: {} }),
    } as unknown as PushSubscription;
    swPush = {
      isEnabled: true,
      subscription,
      requestSubscription: vi.fn().mockImplementation(async () => {
        setPermission('granted');
        subscription.next(fresh);
        return fresh;
      }),
      unsubscribe: vi.fn().mockImplementation(async () => subscription.next(null)),
    };
    fetchSpy = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    (globalThis as { __organizaAiRuntimeConfig?: unknown }).__organizaAiRuntimeConfig = {
      push: { url: RELAY },
    };
    setPermission('default');
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as { __organizaAiRuntimeConfig?: unknown }).__organizaAiRuntimeConfig;
  });

  it('is off until the person taps, then registers the device with the relay', async () => {
    const service = create();
    expect(service.state()).toBe('off');
    expect(swPush.requestSubscription).not.toHaveBeenCalled();

    expect(await service.enable()).toBe(true);
    expect(service.state()).toBe('on');
    expect(fetchSpy).toHaveBeenCalledWith(
      `${RELAY}/devices`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer id-token' }),
      }),
    );
  });

  it('undoes the subscription when the relay does not keep it', async () => {
    fetchSpy.mockResolvedValue(new Response('{}', { status: 500 }));
    const service = create();
    expect(await service.enable()).toBe(false);
    expect(swPush.unsubscribe).toHaveBeenCalled();
    expect(service.state()).toBe('off');
  });

  it('turns itself on at sign-in when the phone already allowed notifications', async () => {
    setPermission('granted');
    const service = create();
    TestBed.tick();
    await vi.waitFor(() => expect(service.state()).toBe('on'));
    expect(swPush.requestSubscription).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(`${RELAY}/devices`, expect.anything());
  });

  it('stays off when the person turned it off on this device', async () => {
    const service = create();
    await service.enable();
    await service.disable();
    swPush.requestSubscription.mockClear();

    const again = create();
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    expect(swPush.requestSubscription).not.toHaveBeenCalled();
    expect(again.state()).toBe('off');
  });

  it('says blocked when the browser said no', () => {
    setPermission('denied');
    expect(create().state()).toBe('blocked');
  });

  it('hides when there is no service worker or no relay', () => {
    expect(create({ swPush: false }).state()).toBe('unsupported');
    (globalThis as { __organizaAiRuntimeConfig?: unknown }).__organizaAiRuntimeConfig = {};
    expect(create().state()).toBe('unsupported');
  });

  it('asks the relay to push a notice, and turns the device off', async () => {
    const service = create();
    await service.enable();
    service.notify('users/jessica/notifications/presence_e1_ana');
    await vi.waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        `${RELAY}/notify`,
        expect.objectContaining({
          body: JSON.stringify({ path: 'users/jessica/notifications/presence_e1_ana' }),
        }),
      ),
    );
    await service.forgetDevice();
    expect(fetchSpy).toHaveBeenLastCalledWith(`${RELAY}/devices/remove`, expect.anything());
    expect(service.state()).toBe('on');
    await service.disable();
    expect(fetchSpy).toHaveBeenCalledWith(`${RELAY}/devices/remove`, expect.anything());
    expect(service.state()).toBe('off');
  });
});

describe('PushService without a relay', () => {
  it('offers nothing, not even the iPhone hint', () => {
    vi.stubGlobal('navigator', { userAgent: 'iPhone', maxTouchPoints: 5, platform: 'iPhone' });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { currentUser: signal(null) } }],
    });
    expect(TestBed.inject(PushService).state()).toBe('unsupported');
    vi.unstubAllGlobals();
  });
});
