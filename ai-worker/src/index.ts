import { verifyIdToken } from './auth';
import { Firestore, toFields, type StoredDoc } from './firestore';
import { AllBusyError, firstAnswer, providers, type ProviderEnv } from './llm';
import {
  PER_EVENT,
  PER_HOUR,
  SYSTEM_PROMPT,
  parseInput,
  parseSuggestion,
  peopleBucket,
  suggestionKey,
  userPrompt,
  type Suggestion,
} from './suggestion';

export interface Env extends ProviderEnv {
  readonly FIREBASE_PROJECT_ID: string;
  /** The app's address: only it (and local development) may call the assistant. */
  readonly APP_ORIGIN: string;
}

const EVENT_ID = /^[A-Za-z0-9_-]{1,128}$/;
const HOUR_MS = 60 * 60 * 1000;

function allowedOrigins(env: Env): string[] {
  return [env.APP_ORIGIN, 'http://localhost:4200'];
}

function cors(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  return allowedOrigins(env).includes(origin)
    ? {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'authorization, content-type',
        'access-control-max-age': '86400',
        vary: 'origin',
      }
    : { vary: 'origin' };
}

function reply(request: Request, env: Env, status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...cors(request, env) },
  });
}

/** Where this person's hour stands: a new hour starts once the last one has passed. */
function hourOf(
  usage: StoredDoc | null,
  now: number,
): { fresh: boolean; count: number; resetAt: number } {
  const start = Date.parse(String(usage?.data['windowStart'] ?? ''));
  const count = Number(usage?.data['count'] ?? 0);
  if (!usage || !Number.isFinite(start) || now >= start + HOUR_MS) {
    return { fresh: true, count: 0, resetAt: now + HOUR_MS };
  }
  return { fresh: false, count, resetAt: start + HOUR_MS };
}

/**
 * One atomic commit, made as the caller: their hour count, the event's count and the shared
 * cache. The rules check every number, so nothing is counted unless the answer was saved, and
 * a count read here that changed meanwhile (two taps at once) fails the whole commit.
 */
function quotaWrites(
  db: Firestore,
  uid: string,
  eventId: string,
  usage: StoredDoc | null,
  hour: { fresh: boolean; count: number },
  key: string,
  cache: Record<string, unknown>,
): unknown[] {
  const now = { setToServerValue: 'REQUEST_TIME' };
  const usageWrite = {
    update: { name: db.name(`ai_usage/${uid}`), fields: toFields({ count: hour.count + 1 }) },
    ...(usage ? { updateMask: { fieldPaths: ['count'] } } : {}),
    updateTransforms: [
      ...(hour.fresh ? [{ fieldPath: 'windowStart', ...now }] : []),
      { fieldPath: 'lastAt', ...now },
    ],
    currentDocument: usage ? { updateTime: usage.updateTime } : { exists: false },
  };
  const eventWrite = {
    update: { name: db.name(`events/${eventId}`), fields: toFields({ aiSuggestionKey: key }) },
    updateMask: { fieldPaths: ['aiSuggestionKey'] },
    updateTransforms: [{ fieldPath: 'aiSuggestionsUsed', increment: { integerValue: '1' } }],
    currentDocument: { exists: true },
  };
  const cacheWrite = {
    update: { name: db.name(`ai_cache/${key}`), fields: toFields(cache) },
    updateTransforms: [{ fieldPath: 'createdAt', ...now }],
    currentDocument: { exists: false },
  };
  return [usageWrite, eventWrite, cacheWrite];
}

/**
 * `POST /suggest {eventId, input: {category, people, items}}` → `{key, suggestion, used}`.
 * Errors: 401 no valid account; 403 not an organizer; 429 `event-limit` / `hour-limit` / `limit`;
 * 503 `busy` (every provider failed; nothing was counted); 409 `retry` (the commit lost a race).
 */
export async function handle(
  request: Request,
  env: Env,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(request, env) });
  }
  if (request.method !== 'POST' || new URL(request.url).pathname !== '/suggest') {
    return reply(request, env, 404);
  }
  const origin = request.headers.get('origin');
  if (origin && !allowedOrigins(env).includes(origin)) return reply(request, env, 403);

  const header = request.headers.get('authorization') ?? '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  const account = idToken
    ? await verifyIdToken(idToken, env.FIREBASE_PROJECT_ID, fetcher, now).catch(() => null)
    : null;
  if (!account) return reply(request, env, 401);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const eventId = typeof body?.['eventId'] === 'string' ? body['eventId'] : '';
  const input = parseInput(body?.['input']);
  if (!EVENT_ID.test(eventId) || !input) return reply(request, env, 400);

  const db = new Firestore(env.FIREBASE_PROJECT_ID, idToken, fetcher);
  const key = suggestionKey(input);
  let event: StoredDoc | null;
  let usage: StoredDoc | null;
  let cached: StoredDoc | null;
  try {
    [event, usage, cached] = await Promise.all([
      db.get(`events/${eventId}`),
      db.get(`ai_usage/${account.uid}`),
      db.get(`ai_cache/${key}`),
    ]);
  } catch {
    return reply(request, env, 503, { error: 'busy' });
  }
  if (!event) return reply(request, env, 404);

  // The same question was answered already: free, nothing counted.
  if (cached) {
    return reply(request, env, 200, { key, suggestion: cached.data, cached: true });
  }

  // Refused here before spending the providers' free quota; the commit enforces it again.
  const collaborators = event.data['collaborators'];
  const organizes =
    event.data['createdBy'] === account.uid ||
    (Array.isArray(collaborators) && collaborators.includes(account.uid));
  if (!organizes) return reply(request, env, 403);
  const used = Number(event.data['aiSuggestionsUsed'] ?? 0);
  if (used >= PER_EVENT) return reply(request, env, 429, { error: 'event-limit', used });
  const hour = hourOf(usage, now);
  if (hour.count >= PER_HOUR) {
    return reply(request, env, 429, {
      error: 'hour-limit',
      retryAt: new Date(hour.resetAt).toISOString(),
    });
  }

  let answer: { value: Suggestion; provider: string };
  try {
    answer = await firstAnswer(
      providers(env),
      SYSTEM_PROMPT,
      userPrompt(input),
      (text) => parseSuggestion(text, input),
      fetcher,
    );
  } catch (error) {
    if (error instanceof AllBusyError) console.warn(error.message);
    return reply(request, env, 503, { error: 'busy' });
  }

  const cache = {
    ...answer.value,
    category: input.category,
    people: peopleBucket(input.people),
    provider: answer.provider,
  };
  const status = await db.commit(quotaWrites(db, account.uid, eventId, usage, hour, key, cache));
  if (status !== 200) {
    // 403: a rule refused (a limit reached meanwhile); 400/409: a count changed meanwhile.
    return reply(request, env, status === 403 ? 429 : 409, {
      error: status === 403 ? 'limit' : 'retry',
    });
  }
  return reply(request, env, 200, { key, suggestion: cache, used: used + 1 });
}

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
} satisfies ExportedHandler<Env>;
