#!/usr/bin/env node

/**
 * Organiza AI — passagem para "dados por referência" (plano, seção 5).
 *
 * Por padrão só gera o relatório: lista, evento por evento, o que mudaria, sem gravar nada.
 *
 *   node scripts/migrate-referencia.mjs                      # ensaio em produção (só leitura)
 *   node scripts/migrate-referencia.mjs --backup tudo.json   # ensaio a partir de uma cópia local
 *   node scripts/migrate-referencia.mjs --apply --sim-producao   # grava (só com o ok do Luiz)
 *   node scripts/migrate-referencia.mjs --drop-names ...      # também apaga name/phone das respostas
 *                                                              # (só depois da limpeza, item 6)
 *
 * O que faz, por evento (rodar de novo não duplica nada):
 * - `events/{id}`: apaga `creatorName` e `creatorEmail` (o nome vem do perfil por `createdBy`).
 * - `guests` de quem tem conta (`uid`, id = uid): o telefone vai para `contacts/{uid}` (só se lá não
 *   houver um), os organizadores do evento entram em `phoneVisibleTo`; apaga `email` e `photoUrl`.
 *   Com `--drop-names`, apaga também `name` e `phone` da resposta.
 * - `declines`: apaga `name`. Com `--drop-names`, `claims` também perde `name`.
 * - `invitations`: `invitedBy` com e-mail vira o uid de quem criou o evento; apaga
 *   `invitedByName` e `invitedByPhoto`.
 * - `users/{uid}/notifications`: apaga `actorName` e `eventTitle`.
 *
 * Fica para o item 4 (amigo oculto): ligar entradas do sorteio ao uid e a lista única.
 *
 * Autenticação: o token do Firebase CLI (`npx firebase login`), como em cleanup-anonymous-users.
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'organiza-ai-3416f';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** An e-mail kept where an account id belongs (older invites). */
export function isEmail(value) {
  return typeof value === 'string' && value.includes('@');
}

/** The uids who organize an event: owner and collaborators. */
export function organizersOf(event) {
  return [event.createdBy, ...(event.collaborators ?? [])].filter(
    (uid, i, all) => typeof uid === 'string' && uid && all.indexOf(uid) === i,
  );
}

/** A guest who answered with their own account (not a relative, not added by hand). */
export function isAccountGuest(guest) {
  return !!guest.uid && guest.id === guest.uid && !guest.primaryGuestId && !guest.addedBy;
}

function present(data, fields) {
  return fields.filter((field) => data && Object.prototype.hasOwnProperty.call(data, field));
}

/**
 * Everything one event needs, as writes: `{ path, remove: [fields], set: {...}, union: {field: [...]},
 * onlyIfMissing: {...} }`. Pure: the same input always plans the same writes, and data already in
 * the new format plans none.
 *
 * `event` = `{ id, data, guests: [{id, ...}], declines, claims, invitations }`;
 * `contacts` = `{ [uid]: {phone?} }` already saved.
 */
export function planEvent(event, contacts = {}, { dropNames = false } = {}) {
  const writes = [];
  const data = event.data ?? {};
  const eventFields = present(data, ['creatorName', 'creatorEmail']);
  if (eventFields.length) writes.push({ path: `events/${event.id}`, remove: eventFields });

  const organizers = organizersOf(data);
  for (const guest of event.guests ?? []) {
    if (!isAccountGuest(guest)) continue;
    const copied = present(guest, ['email', 'photoUrl', ...(dropNames ? ['name', 'phone'] : [])]);
    if (copied.length) {
      writes.push({ path: `events/${event.id}/guests/${guest.id}`, remove: copied });
    }
    const viewers = organizers.filter((uid) => uid !== guest.uid);
    const saved = contacts[guest.uid];
    const phone = typeof guest.phone === 'string' ? guest.phone.trim() : '';
    const visible = new Set(saved?.phoneVisibleTo ?? []);
    const missingViewers = viewers.filter((uid) => !visible.has(uid));
    const needsPhone = !!phone && !saved?.phone;
    if (missingViewers.length || needsPhone) {
      writes.push({
        path: `contacts/${guest.uid}`,
        ...(needsPhone ? { onlyIfMissing: { phone } } : {}),
        ...(missingViewers.length ? { union: { phoneVisibleTo: missingViewers } } : {}),
      });
    }
  }

  for (const decline of event.declines ?? []) {
    if (present(decline, ['name']).length) {
      writes.push({ path: `events/${event.id}/declines/${decline.id}`, remove: ['name'] });
    }
  }
  if (dropNames) {
    for (const claims of event.claims ?? []) {
      if (present(claims, ['name']).length) {
        writes.push({ path: `events/${event.id}/claims/${claims.id}`, remove: ['name'] });
      }
    }
  }
  for (const invite of event.invitations ?? []) {
    const remove = present(invite, ['invitedByName', 'invitedByPhoto']);
    const set = isEmail(invite.invitedBy) && data.createdBy ? { invitedBy: data.createdBy } : null;
    if (remove.length || set) {
      writes.push({
        path: `events/${event.id}/invitations/${invite.id}`,
        ...(remove.length ? { remove } : {}),
        ...(set ? { set } : {}),
      });
    }
  }
  return writes;
}

/** Notices that still carry a copied name or title. */
export function planNotifications(notices) {
  return notices
    .map((notice) => ({ notice, remove: present(notice, ['actorName', 'eventTitle']) }))
    .filter(({ remove }) => remove.length)
    .map(({ notice, remove }) => ({ path: notice.path, remove }));
}

/** One line per event for the report, and the totals. */
export function summarize(plans) {
  const lines = [];
  const totals = {};
  for (const { title, id, writes } of plans) {
    const counts = {};
    for (const write of writes) {
      const kind = write.path.split('/').at(-2);
      counts[kind] = (counts[kind] ?? 0) + 1;
      totals[kind] = (totals[kind] ?? 0) + 1;
    }
    const detail = Object.entries(counts)
      .map(([kind, n]) => `${kind}: ${n}`)
      .join(', ');
    lines.push(`- ${title || id} (${id}): ${writes.length ? detail : 'nada a mudar'}`);
  }
  return { lines, totals, pending: Object.values(totals).reduce((a, b) => a + b, 0) };
}

// ---------------------------------------------------------------------------------------------
// Firestore REST (only below this line touches the network)

function decode(value) {
  if (!value || typeof value !== 'object') return value;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decode);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields ?? {});
  return value;
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]));
}

function encode(value) {
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value === null) return { nullValue: null };
  throw new Error(`Tipo não esperado ao gravar: ${typeof value}`);
}

/** A document path for a URL: each segment encoded (invite ids are e-mails). */
function urlPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function token() {
  const path = join(homedir(), '.config/configstore/firebase-tools.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')).tokens?.access_token ?? null;
  } catch {
    return null;
  }
}

async function call(accessToken, url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = new Error(`${res.status} ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function list(accessToken, path) {
  const docs = [];
  let pageToken = '';
  do {
    const page = await call(
      accessToken,
      `${BASE}/${urlPath(path)}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`,
    );
    for (const doc of page.documents ?? []) {
      docs.push({
        id: doc.name.split('/').at(-1),
        path: doc.name.split('/documents/')[1],
        ...decodeFields(doc.fields ?? {}),
      });
    }
    pageToken = page.nextPageToken ?? '';
  } while (pageToken);
  return docs;
}

async function notifications(accessToken) {
  const rows = await call(accessToken, `${BASE}:runQuery`, {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: { from: [{ collectionId: 'notifications', allDescendants: true }] },
    }),
  });
  return rows
    .filter((row) => row.document)
    .map((row) => ({
      path: row.document.name.split('/documents/')[1],
      ...decodeFields(row.document.fields ?? {}),
    }));
}

async function loadFromProduction(accessToken) {
  const events = await list(accessToken, 'events');
  const contacts = Object.fromEntries((await list(accessToken, 'contacts')).map((c) => [c.id, c]));
  const full = [];
  for (const event of events) {
    const { id, path: _path, ...data } = event;
    // An empty subcollection answers 200 with nothing: any error stops the run.
    const sub = async (name) => list(accessToken, `events/${id}/${name}`);
    full.push({
      id,
      data,
      guests: await sub('guests'),
      declines: await sub('declines'),
      claims: await sub('claims'),
      invitations: await sub('invitations'),
    });
  }
  return { events: full, contacts, notices: await notifications(accessToken) };
}

function loadFromBackup(file) {
  const dump = JSON.parse(readFileSync(file, 'utf8'));
  const flat = (docs = []) => docs.map((doc) => ({ id: doc.id, ...(doc.data ?? {}) }));
  return {
    events: (dump.events ?? []).map((event) => ({
      id: event.id,
      data: event.data ?? {},
      guests: flat(event.collections?.guests),
      declines: flat(event.collections?.declines),
      claims: flat(event.collections?.claims),
      invitations: flat(event.collections?.invitations),
    })),
    contacts: {},
    notices: [],
  };
}

/**
 * One commit per document: a field delete is an update whose mask names the field, and adding to
 * `phoneVisibleTo` rides the same write (`updateTransforms`): Firestore refuses two writes to one
 * document in a commit. `onlyIfMissing` reads the document first; only "not found" counts as
 * missing, any other error stops the run (never overwrite a phone on a failed read).
 */
export async function apply(accessToken, write) {
  const name = `projects/${PROJECT_ID}/databases/(default)/documents/${write.path}`;
  const set = { ...(write.set ?? {}) };
  if (write.onlyIfMissing) {
    let current = null;
    try {
      current = await call(accessToken, `${BASE}/${urlPath(write.path)}`);
    } catch (err) {
      if (err.status !== 404) throw err;
    }
    const fields = current?.fields ? decodeFields(current.fields) : {};
    for (const [key, value] of Object.entries(write.onlyIfMissing)) {
      if (!fields[key]) set[key] = value;
    }
  }
  const mask = [...(write.remove ?? []), ...Object.keys(set)];
  const fieldTransforms = Object.entries(write.union ?? {}).map(([fieldPath, values]) => ({
    fieldPath,
    appendMissingElements: { values: values.map(encode) },
  }));
  let commit = null;
  if (mask.length) {
    commit = {
      update: {
        name,
        fields: Object.fromEntries(Object.entries(set).map(([k, v]) => [k, encode(v)])),
      },
      updateMask: { fieldPaths: mask },
      ...(fieldTransforms.length ? { updateTransforms: fieldTransforms } : {}),
      // A contact may be new; everything else must already be there.
      ...(write.path.startsWith('contacts/') ? {} : { currentDocument: { exists: true } }),
    };
  } else if (fieldTransforms.length) {
    commit = { transform: { document: name, fieldTransforms } };
  }
  if (!commit) return null;
  const body = { writes: [commit] };
  await call(accessToken, `${BASE}:commit`, { method: 'POST', body: JSON.stringify(body) });
  return body;
}

/** `--backup <file>`: the file must follow and exist; anything else stops before reading. */
export function backupArg(args) {
  if (args.some((arg) => arg.startsWith('--backup='))) {
    throw new Error('Use --backup <arquivo> (com espaço), não --backup=<arquivo>.');
  }
  const at = args.indexOf('--backup');
  if (at < 0) return null;
  const file = args[at + 1];
  if (!file || file.startsWith('--') || !existsSync(file)) {
    throw new Error(`--backup precisa de um arquivo que exista${file ? `: ${file}` : ''}.`);
  }
  return file;
}

async function main() {
  const args = process.argv.slice(2);
  let backup;
  try {
    backup = backupArg(args);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
  const applying = args.includes('--apply');
  const dropNames = args.includes('--drop-names');
  if (applying && (backup || !args.includes('--sim-producao'))) {
    console.error(
      '❌ Gravar exige --apply --sim-producao, sem --backup, e o ok de quem cuida do app.',
    );
    process.exit(1);
  }

  let source;
  let accessToken = null;
  if (backup) {
    source = loadFromBackup(backup);
    console.log(`📦 Ensaio a partir da cópia ${backup} (nada é lido nem gravado em produção).`);
  } else {
    accessToken = token();
    if (!accessToken) {
      console.error('❌ Token do Firebase CLI não encontrado. Rode "npx firebase login".');
      process.exit(1);
    }
    source = await loadFromProduction(accessToken);
    console.log(applying ? '✍️  Gravando em produção.' : '🔎 Ensaio em produção: só leitura.');
  }

  const plans = source.events.map((event) => ({
    id: event.id,
    title: event.data.title,
    writes: planEvent(event, source.contacts, { dropNames }),
  }));
  const noticeWrites = planNotifications(source.notices);
  const report = summarize([
    ...plans,
    { id: 'notifications', title: 'Avisos no sino', writes: noticeWrites },
  ]);
  console.log(report.lines.join('\n'));
  console.log(`\nTotal de documentos a mudar: ${report.pending}`, report.totals);

  if (!applying) {
    console.log(
      '\nNada foi gravado. Para gravar: --apply --sim-producao (com cópia de segurança antes).',
    );
    return;
  }
  let done = 0;
  for (const write of [...plans.flatMap((plan) => plan.writes), ...noticeWrites]) {
    await apply(accessToken, write);
    done += 1;
  }
  console.log(`\n✅ ${done} documento(s) atualizados. Rode o ensaio de novo: deve dar zero.`);
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('migrate-referencia.mjs')
) {
  main().catch((err) => {
    console.error('❌', err.message || err);
    process.exit(1);
  });
}
