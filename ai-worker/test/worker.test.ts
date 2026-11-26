import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { forgetKeys, verifyIdToken } from '../src/auth';
import { handle, type Env } from '../src/index';

const PROJECT = 'organiza-test';
const NOW = Date.parse('2026-11-25T12:00:00Z');
const APP = 'https://organizaai.web.app';

const b64url = (data: string | Uint8Array) =>
  Buffer.from(typeof data === 'string' ? data : data).toString('base64url');

let privateKey: CryptoKey;
let publicJwk: JsonWebKey;

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair;
  privateKey = pair.privateKey;
  publicJwk = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey;
});

async function idToken(claims: Record<string, unknown> = {}, kid = 'key-1'): Promise<string> {
  const seconds = Math.floor(NOW / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', kid }));
  const payload = b64url(
    JSON.stringify({
      aud: PROJECT,
      iss: `https://securetoken.google.com/${PROJECT}`,
      sub: 'ana',
      iat: seconds - 60,
      exp: seconds + 3600,
      firebase: { sign_in_provider: 'google.com' },
      ...claims,
    }),
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(`${header}.${payload}`),
  );
  return `${header}.${payload}.${b64url(new Uint8Array(signature))}`;
}

/** Firestore documents by path, as the REST API returns them. */
let docs: Map<string, Record<string, unknown>>;
let commits: { writes: { update: { name: string } }[] }[];
let commitStatus: number;
/** Answers per provider host, in order; each call takes the next one. */
let answers: Record<'gemini' | 'groq', Response[]>;
let providerCalls: string[];

function firestoreFields(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'number'
        ? { integerValue: String(value) }
        : Array.isArray(value)
          ? { arrayValue: { values: value.map((v) => ({ stringValue: v })) } }
          : { stringValue: value },
    ]),
  );
}

const fakeFetch: typeof fetch = async (input, init) => {
  const url = String(input);
  if (url.includes('securetoken@system')) {
    return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: 'key-1' }] }), {
      headers: { 'cache-control': 'public, max-age=3600' },
    });
  }
  if (url.endsWith(':commit')) {
    commits.push(JSON.parse(String(init?.body)));
    return new Response('{}', { status: commitStatus });
  }
  if (url.includes('firestore.googleapis.com')) {
    const path = decodeURIComponent(url.split('/documents/')[1]);
    const data = docs.get(path);
    return data
      ? new Response(
          JSON.stringify({ fields: firestoreFields(data), updateTime: '2026-11-25T11:00:00Z' }),
        )
      : new Response('{}', { status: 404 });
  }
  const host = url.includes('generativelanguage') ? 'gemini' : url.includes('groq') ? 'groq' : null;
  if (host) {
    providerCalls.push(host);
    return answers[host].shift() ?? new Response('{}', { status: 500 });
  }
  throw new Error(`unexpected fetch ${url}`);
};

const SUGGESTION = {
  items: [{ name: 'Picanha', quantity: 6, unit: 'kg', reason: 'carne principal' }],
  tip: 'Compre o gelo no dia.',
};
const geminiOk = () =>
  new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(SUGGESTION) }] } }],
    }),
  );
const groqOk = () =>
  new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(SUGGESTION) } }] }));

const env: Env = {
  FIREBASE_PROJECT_ID: PROJECT,
  APP_ORIGIN: APP,
  GEMINI_API_KEY: 'gemini-key',
  GROQ_API_KEY: 'groq-key',
  GEMINI_MODELS: 'flash-lite,flash',
  GROQ_MODELS: 'llama',
};

const INPUT = { category: 'Churrasco', people: 20, items: ['Carvão'] };

async function suggest(token: string, body: unknown = { eventId: 'ev1', input: INPUT }) {
  const response = await handle(
    new Request('https://ai.test/suggest', {
      method: 'POST',
      headers: {
        origin: APP,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    }),
    env,
    fakeFetch,
    NOW,
  );
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

beforeEach(() => {
  forgetKeys();
  docs = new Map([['events/ev1', { createdBy: 'ana', collaborators: [], aiSuggestionsUsed: 0 }]]);
  commits = [];
  commitStatus = 200;
  answers = { gemini: [], groq: [] };
  providerCalls = [];
});

describe('verifyIdToken', () => {
  it('accepts a token signed by Google for this project', async () => {
    expect(await verifyIdToken(await idToken(), PROJECT, fakeFetch, NOW)).toEqual({ uid: 'ana' });
  });

  it.each([
    ['another project', { aud: 'other' }],
    ['an expired token', { exp: Math.floor(NOW / 1000) - 1 }],
    ['an anonymous account', { firebase: { sign_in_provider: 'anonymous' } }],
  ])('refuses %s', async (_, claims) => {
    expect(await verifyIdToken(await idToken(claims), PROJECT, fakeFetch, NOW)).toBeNull();
  });

  it('refuses a token whose payload was changed after signing', async () => {
    const [header, , signature] = (await idToken()).split('.');
    const forged = b64url(JSON.stringify({ aud: PROJECT, sub: 'admin' }));
    expect(
      await verifyIdToken(`${header}.${forged}.${signature}`, PROJECT, fakeFetch, NOW),
    ).toBeNull();
  });
});

describe('POST /suggest', () => {
  it('answers with Gemini and saves the count and the cache in one commit', async () => {
    answers.gemini.push(geminiOk());
    const { status, body } = await suggest(await idToken());
    expect(status).toBe(200);
    expect(body['used']).toBe(1);
    expect(body['key']).toMatch(/^churrasco_20p_/);
    expect(providerCalls).toEqual(['gemini']);
    expect(commits).toHaveLength(1);
    expect(commits[0].writes.map((w) => w.update.name.split('/documents/')[1])).toEqual([
      'ai_usage/ana',
      'events/ev1',
      `ai_cache/${body['key']}`,
    ]);
  });

  it('falls back to the next Gemini model, then to Groq, in the same request', async () => {
    answers.gemini.push(new Response('{}', { status: 429 }), new Response('{}', { status: 503 }));
    answers.groq.push(groqOk());
    const { status, body } = await suggest(await idToken());
    expect(status).toBe(200);
    expect(providerCalls).toEqual(['gemini', 'gemini', 'groq']);
    expect((body['suggestion'] as Record<string, unknown>)['provider']).toBe('groq:llama');
  });

  it('says busy and counts nothing when every provider fails', async () => {
    answers.gemini.push(new Response('{}', { status: 429 }), new Response('{}', { status: 429 }));
    answers.groq.push(new Response('{}', { status: 429 }));
    const { status, body } = await suggest(await idToken());
    expect(status).toBe(503);
    expect(body).toEqual({ error: 'busy' });
    expect(commits).toEqual([]);
  });

  it('returns a cached answer without asking any provider or counting', async () => {
    const key = (await import('../src/suggestion')).suggestionKey(INPUT);
    docs.set(`ai_cache/${key}`, { tip: 'do cache' });
    const { status, body } = await suggest(await idToken());
    expect(status).toBe(200);
    expect(body['cached']).toBe(true);
    expect(providerCalls).toEqual([]);
    expect(commits).toEqual([]);
  });

  it('refuses the 4th suggestion of an event before asking any provider', async () => {
    docs.set('events/ev1', { createdBy: 'ana', aiSuggestionsUsed: 3 });
    const { status, body } = await suggest(await idToken());
    expect(status).toBe(429);
    expect(body['error']).toBe('event-limit');
    expect(providerCalls).toEqual([]);
  });

  it('refuses the 6th suggestion within the hour, and allows it once the hour passed', async () => {
    docs.set('ai_usage/ana', { count: 5, windowStart: '2026-11-25T11:30:00Z' });
    expect((await suggest(await idToken())).body['error']).toBe('hour-limit');

    docs.set('ai_usage/ana', { count: 5, windowStart: '2026-11-25T10:59:00Z' });
    answers.gemini.push(geminiOk());
    expect((await suggest(await idToken())).status).toBe(200);
  });

  it('refuses someone who does not organise the event', async () => {
    docs.set('events/ev1', { createdBy: 'bia', collaborators: [] });
    expect((await suggest(await idToken())).status).toBe(403);
    expect(providerCalls).toEqual([]);
  });

  it('refuses a missing or invalid token and a malformed body', async () => {
    expect((await suggest('not-a-token')).status).toBe(401);
    expect((await suggest(await idToken(), { eventId: 'ev1', input: { people: 3 } })).status).toBe(
      400,
    );
  });

  it('discards the answer when the rules refuse the commit', async () => {
    answers.gemini.push(geminiOk());
    commitStatus = 403;
    const { status, body } = await suggest(await idToken());
    expect(status).toBe(429);
    expect(body).toEqual({ error: 'limit' });
  });
});
