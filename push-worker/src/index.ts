import type { VapidKeys } from '@block65/webcrypto-web-push';
import { lookupAccount, readDocAs } from './firebase';
import { pushToPerson, type PhoneNotice } from './push';
import { firstTime, isSubscription, removeDevices, saveDevice, uidByEmail } from './subscriptions';

export interface Env {
  readonly DEVICES: KVNamespace;
  readonly FIREBASE_PROJECT_ID: string;
  readonly FIREBASE_API_KEY: string;
  /** The app's address: links in a notice open there, and only it may call the relay. */
  readonly APP_ORIGIN: string;
  readonly VAPID_PUBLIC_KEY: string;
  readonly VAPID_PRIVATE_KEY: string;
}

/** `users/{uid}/notifications/{id}`: a notice someone wrote in another person's bell. */
const NOTICE_PATH = /^users\/([A-Za-z0-9_-]{1,128})\/notifications\/([A-Za-z0-9_.-]{1,300})$/;
/** `events/{eventId}/invitations/{email}`: an invite to help organise an event. */
const INVITE_PATH = /^events\/([A-Za-z0-9_-]{1,128})\/invitations\/([^/\s]{3,254})$/;

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

function bearer(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

/** The phone notice for a document the caller may read, and who receives it. */
async function noticeFor(
  path: string,
  idToken: string,
  env: Env,
  fetcher: typeof fetch,
): Promise<{ uid: string; notice: PhoneNotice; version: string } | null> {
  const notice = NOTICE_PATH.exec(path);
  if (notice) {
    const [, uid, id] = notice;
    const doc = await readDocAs(path, idToken, env.FIREBASE_PROJECT_ID, fetcher);
    if (!doc || doc['readAt']) return null;
    const url = text(doc['actionUrl'], 300);
    if (!url.startsWith('/')) return null;
    return {
      uid,
      notice: { title: text(doc['title'], 200), body: text(doc['body'], 500), url, tag: id },
      version: `${uid}:${id}:${text(doc['createdAt'], 40)}`,
    };
  }

  const invite = INVITE_PATH.exec(path);
  if (invite) {
    const [, eventId, email] = invite;
    // Only the event's organizers read its invitations.
    const doc = await readDocAs(path, idToken, env.FIREBASE_PROJECT_ID, fetcher);
    if (!doc) return null;
    const uid = await uidByEmail(env.DEVICES, decodeURIComponent(email));
    if (!uid) return null;
    const by = text(doc['invitedByName'], 120);
    const title = text(doc['eventTitle'], 200) || 'um evento';
    return {
      uid,
      notice: {
        title: 'Convite para colaborar',
        body: by
          ? `${by} convidou você para ajudar a organizar ${title}.`
          : `Você foi convidado(a) para ajudar a organizar ${title}.`,
        url: `/evento/${eventId}`,
        tag: `invite_${eventId}`,
      },
      version: `invite:${eventId}:${email}:${text(doc['createdAt'], 40)}`,
    };
  }
  return null;
}

export async function handle(
  request: Request,
  env: Env,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (request.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: cors(request, env) });
  if (request.method !== 'POST') return reply(request, env, 405);
  const origin = request.headers.get('origin');
  if (origin && !allowedOrigins(env).includes(origin)) return reply(request, env, 403);

  const idToken = bearer(request);
  if (!idToken) return reply(request, env, 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return reply(request, env, 400);
  const route = new URL(request.url).pathname;

  if (route === '/devices' || route === '/devices/remove') {
    const account = await lookupAccount(idToken, env.FIREBASE_API_KEY, fetcher);
    if (!account) return reply(request, env, 401);
    if (route === '/devices/remove') {
      if (typeof body['endpoint'] !== 'string') return reply(request, env, 400);
      await removeDevices(env.DEVICES, account.uid, [body['endpoint']]);
      return reply(request, env, 200, { ok: true });
    }
    if (!isSubscription(body['subscription'])) return reply(request, env, 400);
    await saveDevice(env.DEVICES, account.uid, account.email, body['subscription']);
    return reply(request, env, 200, { ok: true });
  }

  if (route === '/notify') {
    const path = typeof body['path'] === 'string' ? body['path'] : '';
    const found = await noticeFor(path, idToken, env, fetcher);
    if (!found) return reply(request, env, 404);
    if (!(await firstTime(env.DEVICES, found.version)))
      return reply(request, env, 200, { sent: 0 });
    const vapid: VapidKeys = {
      subject: env.APP_ORIGIN,
      publicKey: env.VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
    };
    const sent = await pushToPerson(
      env.DEVICES,
      found.uid,
      found.notice,
      vapid,
      env.APP_ORIGIN,
      fetcher,
    );
    return reply(request, env, 200, { sent });
  }

  return reply(request, env, 404);
}

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
} satisfies ExportedHandler<Env>;
