import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { suggestionKey } from '../utils/ai-suggestion.utils';
import { AI_BUSY_MESSAGE, AiSuggestionService } from './ai-suggestion.service';
import { AuthService } from './auth.service';
import { FirestoreGateway } from './firestore.gateway';

const RELAY = 'https://organizaai-ai.test.workers.dev';
const INPUT = { category: 'Churrasco', people: 20, items: ['Carvão'] };
const SUGGESTION = {
  items: [{ name: 'Picanha', quantity: 6, unit: 'kg', reason: 'carne principal' }],
  tip: 'Gelo no dia.',
};

interface RuntimeGlobal {
  __organizaAiRuntimeConfig?: unknown;
}

describe('AiSuggestionService', () => {
  let cache: Record<string, unknown>;
  let gateway: { getDoc: ReturnType<typeof vi.fn>; updateDoc: ReturnType<typeof vi.fn> };
  let fetchSpy: ReturnType<typeof vi.fn>;
  let service: AiSuggestionService;

  /** Until the background request settles. */
  async function settled(eventId = 'ev1') {
    await vi.waitFor(() => expect(service.stateFor(eventId).status).not.toBe('loading'));
  }

  beforeEach(() => {
    cache = {};
    gateway = {
      getDoc: vi.fn(async (path: string) => cache[path] ?? null),
      updateDoc: vi.fn().mockResolvedValue(undefined),
    };
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    (globalThis as RuntimeGlobal).__organizaAiRuntimeConfig = { ai: { url: RELAY } };
    TestBed.configureTestingModule({
      providers: [
        { provide: FirestoreGateway, useValue: gateway },
        {
          provide: AuthService,
          useValue: { currentUser: signal({ getIdToken: async () => 'id-token' }) },
        },
      ],
    });
    service = TestBed.inject(AiSuggestionService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as RuntimeGlobal).__organizaAiRuntimeConfig;
  });

  it('runs in the background: loading at once, then the answer from the relay', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ key: 'k', suggestion: SUGGESTION, used: 1 })),
    );
    service.generate('ev1', INPUT);
    expect(service.stateFor('ev1').status).toBe('loading');
    await settled();
    expect(service.stateFor('ev1')).toEqual({
      status: 'ready',
      suggestion: SUGGESTION,
      message: '',
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${RELAY}/suggest`);
    expect((init.headers as Record<string, string>)['authorization']).toBe('Bearer id-token');
    expect(JSON.parse(String(init.body))).toEqual({ eventId: 'ev1', input: INPUT });
    expect(service.lastDone()?.ok).toBe(true);
  });

  it('uses the shared cache first, without calling the relay', async () => {
    cache[`ai_cache/${suggestionKey(INPUT)}`] = SUGGESTION;
    service.generate('ev1', INPUT);
    await settled();
    expect(service.stateFor('ev1').suggestion).toEqual(SUGGESTION);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(gateway.updateDoc).toHaveBeenCalledWith('events/ev1', {
      aiSuggestionKey: suggestionKey(INPUT),
    });
  });

  it('says the assistants are busy when every provider failed', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ error: 'busy' }), { status: 503 }));
    service.generate('ev1', INPUT);
    await settled();
    expect(service.stateFor('ev1')).toEqual({
      status: 'error',
      suggestion: null,
      message: AI_BUSY_MESSAGE,
    });
    expect(service.lastDone()).toEqual({ eventId: 'ev1', ok: false, message: AI_BUSY_MESSAGE });
  });

  it('says so when the network fails, keeping the previous answer on screen', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ suggestion: SUGGESTION })));
    service.generate('ev1', INPUT);
    await settled();
    fetchSpy.mockRejectedValueOnce(new TypeError('offline'));
    service.generate('ev1', { ...INPUT, items: ['Carvão', 'Picanha'] });
    await settled();
    expect(service.stateFor('ev1').suggestion).toEqual(SUGGESTION);
    expect(service.stateFor('ev1').message).toBe(AI_BUSY_MESSAGE);
  });

  it('explains the event and hourly limits', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'event-limit' }), { status: 429 }),
    );
    service.generate('ev1', INPUT);
    await settled();
    expect(service.stateFor('ev1').message).toBe(
      'Este evento já usou as 3 sugestões do Organiza AI.',
    );

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'hour-limit', retryAt: 'x' }), { status: 429 }),
    );
    service.generate('ev2', INPUT);
    await settled('ev2');
    expect(service.stateFor('ev2').message).toBe(
      'Você já pediu 5 sugestões nesta hora. Tente de novo mais tarde.',
    );
  });

  it('does not start a second request while one runs', () => {
    fetchSpy.mockReturnValue(new Promise(() => undefined));
    service.generate('ev1', INPUT);
    service.generate('ev1', INPUT);
    expect(gateway.getDoc).toHaveBeenCalledTimes(1);
  });

  it('shows the suggestion saved on the event after a reload', async () => {
    cache['ai_cache/k1'] = SUGGESTION;
    await service.restore('ev1', 'k1');
    expect(service.stateFor('ev1').suggestion).toEqual(SUGGESTION);
  });

  it('is unavailable while the relay is not deployed', () => {
    delete (globalThis as RuntimeGlobal).__organizaAiRuntimeConfig;
    expect(service.isAvailable()).toBe(false);
  });
});
