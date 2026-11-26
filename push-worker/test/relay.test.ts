import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handle, type Env } from '../src/index';
import { devicesOf } from '../src/subscriptions';
import { ngswPayload } from '../src/push';

class MemoryKv {
  readonly data = new Map<string, string>();
  async get(key: string, type?: string) {
    const value = this.data.get(key) ?? null;
    return value !== null && type === 'json' ? JSON.parse(value) : value;
  }
  async put(key: string, value: string) {
    this.data.set(key, value);
  }
  async delete(key: string) {
    this.data.delete(key);
  }
}

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  Buffer.from(bytes as ArrayBuffer).toString('base64url');

async function vapidKeys() {
  const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey;
  return {
    publicKey: b64url((await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer),
    privateKey: jwk.d!,
  };
}

/** A browser's subscription: a real P-256 key, so the payload is really encrypted. */
async function subscription(endpoint: string) {
  const pair = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])) as CryptoKeyPair;
  return {
    endpoint,
    expirationTime: null,
    keys: {
      p256dh: b64url((await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer),
      auth: b64url(crypto.getRandomValues(new Uint8Array(16))),
    },
  };
}

const APP = 'https://organizaai.web.app';
let kv: MemoryKv;
let env: Env;
let pushed: { url: string; headers: Record<string, string> }[];
/** Firestore documents each token may read: `${token} ${path}`. */
let readable: Map<string, Record<string, unknown>>;
let pushStatus = 201;

const accounts: Record<string, { localId: string; email: string }> = {
  'token-jessica': { localId: 'jessica', email: 'Jessica@Test.com' },
  'token-ana': { localId: 'ana', email: 'ana@test.com' },
};

function firestoreFields(doc: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(doc).map(([key, value]) => [
      key,
      value === null ? { nullValue: null } : { stringValue: String(value) },
    ]),
  );
}

const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.startsWith('https://identitytoolkit.googleapis.com/')) {
    const { idToken } = JSON.parse(String(init?.body));
    const user = accounts[idToken];
    return user ? Response.json({ users: [user] }) : new Response('{}', { status: 400 });
  }
  if (url.startsWith('https://firestore.googleapis.com/')) {
    const token = String((init?.headers as Record<string, string>)['authorization']).slice(7);
    const path = decodeURIComponent(url.split('/documents/')[1]);
    const doc = readable.get(`${token} ${path}`);
    return doc
      ? Response.json({ fields: firestoreFields(doc) })
      : new Response('{}', { status: 403 });
  }
  pushed.push({ url, headers: init?.headers as Record<string, string> });
  return new Response(null, { status: pushStatus });
}) as unknown as typeof fetch;

function call(route: string, token: string | null, body: unknown, origin = APP) {
  return handle(
    new Request(`https://push.test${route}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }),
    env,
    fakeFetch,
  );
}

const presence = {
  kind: 'presence',
  title: 'Ana confirmou presença',
  body: 'Natal 2026 · com 2 acompanhantes',
  actionUrl: '/evento/e1',
  createdAt: '2026-11-24T10:00:00.000Z',
  readAt: null,
};
const noticePath = 'users/jessica/notifications/presence_e1_ana';

beforeEach(async () => {
  kv = new MemoryKv();
  env = {
    DEVICES: kv as unknown as KVNamespace,
    FIREBASE_PROJECT_ID: 'organiza-ai-3416f',
    FIREBASE_API_KEY: 'key',
    APP_ORIGIN: APP,
    VAPID_PUBLIC_KEY: '',
    VAPID_PRIVATE_KEY: '',
  };
  const vapid = await vapidKeys();
  env = { ...env, VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey };
  pushed = [];
  readable = new Map();
  pushStatus = 201;
});

describe('push relay', () => {
  it('saves a phone for the signed-in person only', async () => {
    const phone = await subscription('https://fcm.googleapis.com/fcm/send/abc');
    expect((await call('/devices', 'token-jessica', { subscription: phone })).status).toBe(200);
    expect(await devicesOf(env.DEVICES, 'jessica')).toHaveLength(1);
    expect(kv.data.get('email:jessica@test.com')).toBe('jessica');

    expect((await call('/devices', 'bad-token', { subscription: phone })).status).toBe(401);
    expect((await call('/devices', null, { subscription: phone })).status).toBe(401);
    expect((await call('/devices', 'token-ana', { subscription: { endpoint: 'x' } })).status).toBe(
      400,
    );
  });

  it('pushes a notice its writer may read to every phone of the person, once', async () => {
    await call('/devices', 'token-jessica', {
      subscription: await subscription('https://fcm.googleapis.com/fcm/send/phone'),
    });
    await call('/devices', 'token-jessica', {
      subscription: await subscription('https://web.push.apple.com/iphone'),
    });
    readable.set(`token-ana ${noticePath}`, presence);

    const response = await call('/notify', 'token-ana', { path: noticePath });
    expect(await response.json()).toEqual({ sent: 2 });
    expect(pushed.map((p) => p.url).sort()).toEqual([
      'https://fcm.googleapis.com/fcm/send/phone',
      'https://web.push.apple.com/iphone',
    ]);
    expect(pushed[0].headers['content-encoding']).toBe('aes128gcm');
    expect(pushed[0].headers['authorization']).toMatch(/^vapid t=/);

    // The same notice again buzzes nobody; a new answer (new createdAt) does.
    expect(await (await call('/notify', 'token-ana', { path: noticePath })).json()).toEqual({
      sent: 0,
    });
    readable.set(`token-ana ${noticePath}`, { ...presence, createdAt: '2026-11-24T11:00:00.000Z' });
    expect(await (await call('/notify', 'token-ana', { path: noticePath })).json()).toEqual({
      sent: 2,
    });
  });

  it('sends nothing for a notice the caller may not read, or another kind of path', async () => {
    await call('/devices', 'token-jessica', {
      subscription: await subscription('https://fcm.googleapis.com/fcm/send/phone'),
    });
    expect((await call('/notify', 'token-ana', { path: noticePath })).status).toBe(404);
    expect((await call('/notify', 'token-ana', { path: 'events/e1' })).status).toBe(404);
    expect(pushed).toHaveLength(0);
  });

  it('forgets a phone the push service says is gone', async () => {
    await call('/devices', 'token-jessica', {
      subscription: await subscription('https://fcm.googleapis.com/fcm/send/old'),
    });
    readable.set(`token-ana ${noticePath}`, presence);
    pushStatus = 410;
    await call('/notify', 'token-ana', { path: noticePath });
    expect(await devicesOf(env.DEVICES, 'jessica')).toHaveLength(0);
  });

  it('finds the phones of someone invited to help organise by their e-mail', async () => {
    await call('/devices', 'token-ana', {
      subscription: await subscription('https://fcm.googleapis.com/fcm/send/ana'),
    });
    const invitePath = 'events/e1/invitations/ana@test.com';
    readable.set(`token-jessica ${invitePath}`, {
      eventTitle: 'Natal 2026',
      invitedByName: 'Jéssica',
      createdAt: '2026-11-24T10:00:00.000Z',
    });
    const response = await call('/notify', 'token-jessica', { path: invitePath });
    expect(await response.json()).toEqual({ sent: 1 });
    expect(pushed[0].url).toBe('https://fcm.googleapis.com/fcm/send/ana');
  });

  it('answers only the app', async () => {
    expect(
      (await call('/notify', 'token-ana', { path: noticePath }, 'https://evil.test')).status,
    ).toBe(403);
    const preflight = await handle(
      new Request('https://push.test/notify', { method: 'OPTIONS', headers: { origin: APP } }),
      env,
      fakeFetch,
    );
    expect(preflight.headers.get('access-control-allow-origin')).toBe(APP);
  });

  it('lets a person turn a phone off', async () => {
    const phone = await subscription('https://fcm.googleapis.com/fcm/send/abc');
    await call('/devices', 'token-jessica', { subscription: phone });
    await call('/devices/remove', 'token-jessica', { endpoint: phone.endpoint });
    expect(await devicesOf(env.DEVICES, 'jessica')).toHaveLength(0);
  });
});

describe('one account per browser', () => {
  it('moves a phone to whoever signs in on it, and stops the previous account notices there', async () => {
    const shared = await subscription('https://fcm.googleapis.com/fcm/send/shared');
    await call('/devices', 'token-jessica', { subscription: shared });
    await call('/devices', 'token-ana', { subscription: shared });

    expect(await devicesOf(env.DEVICES, 'jessica')).toHaveLength(0);
    expect(await devicesOf(env.DEVICES, 'ana')).toHaveLength(1);
    readable.set(`token-ana ${noticePath}`, presence);
    expect(await (await call('/notify', 'token-ana', { path: noticePath })).json()).toEqual({
      sent: 0,
    });
  });

  it('refuses a link that leaves the app', async () => {
    await call('/devices', 'token-jessica', {
      subscription: await subscription('https://fcm.googleapis.com/fcm/send/phone'),
    });
    readable.set(`token-ana ${noticePath}`, { ...presence, actionUrl: '//evil.test' });
    expect((await call('/notify', 'token-ana', { path: noticePath })).status).toBe(404);
  });
});

describe('KV writes', () => {
  it('writes nothing when the same device is sent again', async () => {
    const phone = await subscription('https://fcm.googleapis.com/fcm/send/abc');
    await call('/devices', 'token-jessica', { subscription: phone });
    const put = vi.spyOn(kv, 'put');
    await call('/devices', 'token-jessica', { subscription: phone });
    expect(put).not.toHaveBeenCalled();
  });
});

describe('what the phone shows', () => {
  it('uses a white silhouette in the status bar and the app icon in the notice', () => {
    const { notification } = ngswPayload(
      { title: 'Ana confirmou presença', body: 'Natal', url: '/evento/e1', tag: 't' },
      'https://organizaai.web.app',
    );
    expect(notification.badge).toBe('https://organizaai.web.app/icons/notification-badge.png');
    expect(notification.icon).toBe('https://organizaai.web.app/icons/android-chrome-192x192.png');
  });
});
