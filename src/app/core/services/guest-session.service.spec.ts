import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GuestSessionService } from './guest-session.service';
import { GuestSession } from '../models';

describe('GuestSessionService', () => {
  const mockSession: GuestSession = {
    name: 'Carlos Silva',
    phone: '11999998888',
  };

  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createService(platform: 'browser' | 'server' = 'browser'): GuestSessionService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [GuestSessionService, { provide: PLATFORM_ID, useValue: platform }],
    });
    return TestBed.inject(GuestSessionService);
  }

  it('should initialize with null session when storage is empty in browser', () => {
    const service = createService('browser');
    expect(service.session()).toBeNull();
    expect(service.isIdentified()).toBe(false);
    expect(service.guestName()).toBe('');
    expect(service.guestPhone()).toBe('');
  });

  it('should restore session from localStorage when valid JSON is present', () => {
    store['organizaai_guest_session'] = JSON.stringify(mockSession);
    const service = createService('browser');

    expect(service.session()).toEqual(mockSession);
    expect(service.isIdentified()).toBe(true);
    expect(service.guestName()).toBe('Carlos Silva');
    expect(service.guestPhone()).toBe('11999998888');
  });

  it('should clear corrupted JSON from storage gracefully during initialization', () => {
    store['organizaai_guest_session'] = '{invalid_json';
    const service = createService('browser');

    expect(service.session()).toBeNull();
    expect(service.isIdentified()).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith('organizaai_guest_session');
  });

  it('should save session in signal and persist to localStorage in browser mode', () => {
    const service = createService('browser');
    service.saveSession(mockSession);

    expect(service.session()).toEqual(mockSession);
    expect(service.isIdentified()).toBe(true);
    expect(service.guestName()).toBe('Carlos Silva');
    expect(service.guestPhone()).toBe('11999998888');
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'organizaai_guest_session',
      JSON.stringify(mockSession),
    );
  });

  it('should clear session from signal and remove from localStorage', () => {
    store['organizaai_guest_session'] = JSON.stringify(mockSession);
    const service = createService('browser');

    expect(service.session()).not.toBeNull();
    service.clearSession();

    expect(service.session()).toBeNull();
    expect(service.isIdentified()).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith('organizaai_guest_session');
  });

  it('should safely fall back in server platform without touching localStorage', () => {
    const service = createService('server');
    expect(service.session()).toBeNull();

    service.saveSession(mockSession);
    expect(service.session()).toEqual(mockSession);

    service.clearSession();
    expect(service.session()).toBeNull();
  });
});
