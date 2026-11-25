import type { PushSubscription } from '@block65/webcrypto-web-push';

/** A person keeps a few phones and computers; the oldest one goes past this. */
export const MAX_DEVICES = 10;

export interface Device extends PushSubscription {
  readonly savedAt: string;
}

const devicesKey = (uid: string) => `devices:${uid}`;
const emailKey = (email: string) => `email:${email}`;

/** Whose a device is now: one account per browser, the last one signed in on it. */
async function ownerKey(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `owner:${hex}`;
}

export function isSubscription(value: unknown): value is PushSubscription {
  const sub = value as PushSubscription | null;
  return (
    !!sub &&
    typeof sub.endpoint === 'string' &&
    sub.endpoint.startsWith('https://') &&
    sub.endpoint.length <= 1000 &&
    typeof sub.keys?.p256dh === 'string' &&
    typeof sub.keys?.auth === 'string' &&
    sub.keys.p256dh.length <= 200 &&
    sub.keys.auth.length <= 100
  );
}

export async function devicesOf(kv: KVNamespace, uid: string): Promise<Device[]> {
  return (await kv.get<Device[]>(devicesKey(uid), 'json')) ?? [];
}

export async function saveDevice(
  kv: KVNamespace,
  uid: string,
  email: string,
  sub: PushSubscription,
  now = new Date(),
): Promise<void> {
  const devices = await devicesOf(kv, uid);
  const known = devices.find((d) => d.endpoint === sub.endpoint);
  const ownerNow = await kv.get(await ownerKey(sub.endpoint));
  const emailNow = email ? await kv.get(emailKey(email)) : uid;
  // The app sends the device again on each sign-in: nothing changed, nothing is written (the
  // free plan counts writes).
  if (
    known?.keys.p256dh === sub.keys.p256dh &&
    known.keys.auth === sub.keys.auth &&
    ownerNow === uid &&
    emailNow === uid
  ) {
    return;
  }
  const others = devices.filter((d) => d.endpoint !== sub.endpoint);
  const device: Device = {
    endpoint: sub.endpoint,
    expirationTime: sub.expirationTime ?? null,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    savedAt: now.toISOString(),
  };
  // Someone else signed in on this browser before: it stops receiving their notices.
  const owner = await ownerKey(sub.endpoint);
  if (ownerNow && ownerNow !== uid) await removeDevices(kv, ownerNow, [sub.endpoint]);
  await kv.put(devicesKey(uid), JSON.stringify([...others, device].slice(-MAX_DEVICES)));
  await kv.put(owner, uid);
  // An invite to help organise names an e-mail: this is how it finds the person's phones.
  if (email) await kv.put(emailKey(email), uid);
}

export async function removeDevices(
  kv: KVNamespace,
  uid: string,
  endpoints: readonly string[],
): Promise<void> {
  if (!endpoints.length) return;
  const devices = await devicesOf(kv, uid);
  const kept = devices.filter((d) => !endpoints.includes(d.endpoint));
  if (kept.length === devices.length) return;
  if (kept.length) await kv.put(devicesKey(uid), JSON.stringify(kept));
  else await kv.delete(devicesKey(uid));
  for (const endpoint of endpoints) {
    const owner = await ownerKey(endpoint);
    if ((await kv.get(owner)) === uid) await kv.delete(owner);
  }
}

export async function uidByEmail(kv: KVNamespace, email: string): Promise<string | null> {
  return kv.get(emailKey(email.toLowerCase()));
}

/**
 * True the first time a notice (at this version) is pushed: sending the same one again does
 * nothing, so nobody can buzz someone's phone by repeating a call.
 */
export async function firstTime(kv: KVNamespace, key: string): Promise<boolean> {
  const sentKey = `sent:${key}`;
  if (await kv.get(sentKey)) return false;
  await kv.put(sentKey, '1', { expirationTtl: 60 * 60 * 24 * 30 });
  return true;
}
