import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PLACEHOLDER_FIREBASE_API_KEY,
  ensureRuntimeConfig,
  firebaseConfig,
} from './firebase-config';

type RuntimeGlobal = typeof globalThis & { __organizaAiRuntimeConfig?: unknown };

describe('firebaseConfig', () => {
  afterEach(() => {
    delete (globalThis as RuntimeGlobal).__organizaAiRuntimeConfig;
    vi.restoreAllMocks();
  });

  it('reads the API key when Firebase asks for it, not when the module loads', () => {
    expect(firebaseConfig.apiKey).toBe(PLACEHOLDER_FIREBASE_API_KEY);
    (globalThis as RuntimeGlobal).__organizaAiRuntimeConfig = { firebase: { apiKey: 'live' } };
    expect(firebaseConfig.apiKey).toBe('live');
  });

  it('loads runtime-config.js again when the first load failed', async () => {
    const append = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      (globalThis as RuntimeGlobal).__organizaAiRuntimeConfig = { firebase: { apiKey: 'live' } };
      queueMicrotask(() => (node as HTMLScriptElement).onload?.(new Event('load')));
      return node;
    });

    await ensureRuntimeConfig();

    expect(append).toHaveBeenCalledTimes(1);
    expect((append.mock.calls[0][0] as HTMLScriptElement).src).toContain(
      'runtime-config.js?retry=',
    );
    expect(firebaseConfig.apiKey).toBe('live');
  });

  it('does nothing when the config is already there', async () => {
    (globalThis as RuntimeGlobal).__organizaAiRuntimeConfig = { firebase: { apiKey: 'live' } };
    const append = vi.spyOn(document.head, 'appendChild');

    await ensureRuntimeConfig();

    expect(append).not.toHaveBeenCalled();
  });
});
