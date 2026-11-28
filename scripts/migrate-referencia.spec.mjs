import assert from 'node:assert/strict';
import test from 'node:test';
import {
  apply,
  backupArg,
  isAccountGuest,
  planEvent,
  planNotifications,
  summarize,
} from './migrate-referencia.mjs';

/** Replaces fetch: `answers` by method + url fragment; records every call. */
function stubFetch(answers) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url,
      method: init.method ?? 'GET',
      body: init.body ? JSON.parse(init.body) : null,
    });
    const answer = answers.find(
      (a) => (init.method ?? 'GET') === a.method && url.includes(a.match),
    );
    const status = answer?.status ?? 200;
    return {
      ok: status < 300,
      status,
      json: async () => answer?.json ?? {},
      text: async () => answer?.text ?? '',
    };
  };
  return { calls, restore: () => (globalThis.fetch = original) };
}

const event = {
  id: 'e1',
  data: {
    title: 'Natal',
    createdBy: 'owner',
    collaborators: ['collab'],
    creatorName: 'Jéssica',
    creatorEmail: 'j@x.com',
  },
  guests: [
    { id: 'ana', uid: 'ana', name: 'Ana', email: 'a@x.com', photoUrl: 'p', phone: '(11) 9' },
    { id: 'ana_f1', name: 'Filho', primaryGuestId: 'ana', phone: '' },
    { id: 'm1', name: 'Vó', addedBy: 'owner', phone: '(11) 8' },
  ],
  declines: [{ id: 'caio', name: 'Caio', message: '' }],
  claims: [{ id: 'ana', name: 'Ana', entries: [] }],
  invitations: [{ id: 'b@x.com', invitedBy: 'j@x.com', invitedByName: 'Jéssica' }],
};

test('migrate-referencia: plans the copied fields out and the phone into contacts', () => {
  const writes = planEvent(event);
  assert.deepEqual(writes, [
    { path: 'events/e1', remove: ['creatorName', 'creatorEmail'] },
    { path: 'events/e1/guests/ana', remove: ['email', 'photoUrl'] },
    {
      path: 'contacts/ana',
      onlyIfMissing: { phone: '(11) 9' },
      union: { phoneVisibleTo: ['owner', 'collab'] },
    },
    { path: 'events/e1/declines/caio', remove: ['name'] },
    {
      path: 'events/e1/invitations/b@x.com',
      remove: ['invitedByName'],
      set: { invitedBy: 'owner' },
    },
  ]);
});

test('migrate-referencia: keeps name and phone on answers unless asked (older app versions)', () => {
  const kept = planEvent(event).find((w) => w.path === 'events/e1/guests/ana');
  assert.ok(!kept.remove.includes('name'));
  const dropped = planEvent(event, {}, { dropNames: true });
  assert.deepEqual(dropped.find((w) => w.path === 'events/e1/guests/ana').remove, [
    'email',
    'photoUrl',
    'name',
    'phone',
  ]);
  assert.ok(dropped.some((w) => w.path === 'events/e1/claims/ana'));
});

test('migrate-referencia: running again plans nothing (already in the new format)', () => {
  const migrated = {
    id: 'e1',
    data: { title: 'Natal', createdBy: 'owner', collaborators: ['collab'] },
    guests: [{ id: 'ana', uid: 'ana', name: 'Ana', phone: '(11) 9' }],
    declines: [{ id: 'caio', message: '' }],
    claims: [],
    invitations: [{ id: 'b@x.com', invitedBy: 'owner' }],
  };
  const contacts = { ana: { phone: '(11) 9', phoneVisibleTo: ['owner', 'collab'] } };
  assert.deepEqual(planEvent(migrated, contacts), []);
});

test('migrate-referencia: never shares a phone with the guest themself, relatives or hand-added', () => {
  assert.equal(isAccountGuest({ id: 'x_f1', uid: 'x', primaryGuestId: 'x' }), false);
  assert.equal(isAccountGuest({ id: 'm1', addedBy: 'owner' }), false);
  const own = planEvent({
    id: 'e2',
    data: { createdBy: 'owner' },
    guests: [{ id: 'owner', uid: 'owner', phone: '(11) 7' }],
  });
  assert.deepEqual(own, [{ path: 'contacts/owner', onlyIfMissing: { phone: '(11) 7' } }]);
});

test('migrate-referencia: notices lose the copied name and title; the report counts by kind', () => {
  const writes = planNotifications([
    { path: 'users/u/notifications/a', actorName: 'Ana', eventTitle: 'Natal', title: 'x' },
    { path: 'users/u/notifications/b', title: 'y' },
  ]);
  assert.deepEqual(writes, [
    { path: 'users/u/notifications/a', remove: ['actorName', 'eventTitle'] },
  ]);
  const report = summarize([{ id: 'e1', title: 'Natal', writes: planEvent(event) }]);
  assert.equal(report.pending, 5);
  assert.match(report.lines[0], /Natal \(e1\)/);
});

test('migrate-referencia: a new contact gets the phone and the list in one write', async () => {
  const net = stubFetch([
    { method: 'GET', match: '/contacts/ana', status: 404 },
    { method: 'POST', match: ':commit' },
  ]);
  try {
    const body = await apply('t', {
      path: 'contacts/ana',
      onlyIfMissing: { phone: '(11) 9' },
      union: { phoneVisibleTo: ['owner'] },
    });
    assert.equal(body.writes.length, 1);
    const [write] = body.writes;
    assert.deepEqual(write.updateMask.fieldPaths, ['phone']);
    assert.equal(write.updateTransforms[0].fieldPath, 'phoneVisibleTo');
    assert.equal(write.currentDocument, undefined);
  } finally {
    net.restore();
  }
});

test('migrate-referencia: a failed read never overwrites a saved phone', async () => {
  const net = stubFetch([{ method: 'GET', match: '/contacts/ana', status: 503 }]);
  try {
    await assert.rejects(apply('t', { path: 'contacts/ana', onlyIfMissing: { phone: '(11) 9' } }));
    assert.ok(!net.calls.some((c) => c.method === 'POST'));
  } finally {
    net.restore();
  }
});

test('migrate-referencia: a saved phone stays; only the list is added', async () => {
  const net = stubFetch([
    {
      method: 'GET',
      match: '/contacts/ana',
      json: { fields: { phone: { stringValue: '(11) 1' } } },
    },
    { method: 'POST', match: ':commit' },
  ]);
  try {
    const body = await apply('t', {
      path: 'contacts/ana',
      onlyIfMissing: { phone: '(11) 9' },
      union: { phoneVisibleTo: ['owner'] },
    });
    assert.deepEqual(Object.keys(body.writes[0]), ['transform']);
  } finally {
    net.restore();
  }
});

test('migrate-referencia: field deletes need the document to exist; ids are URL-safe', async () => {
  const net = stubFetch([{ method: 'POST', match: ':commit' }]);
  try {
    const body = await apply('t', {
      path: 'events/e1/invitations/b+1@x.com',
      remove: ['invitedByName'],
      set: { invitedBy: 'owner' },
    });
    assert.deepEqual(body.writes[0].currentDocument, { exists: true });
    assert.deepEqual(body.writes[0].updateMask.fieldPaths, ['invitedByName', 'invitedBy']);
  } finally {
    net.restore();
  }
});

test('migrate-referencia: --backup needs an existing file, never falls back to production', () => {
  assert.equal(backupArg(['--apply']), null);
  assert.throws(() => backupArg(['--backup']));
  assert.throws(() => backupArg(['--backup', '--apply']));
  assert.throws(() => backupArg(['--backup=tudo.json']));
  assert.throws(() => backupArg(['--backup', 'nao-existe.json']));
  assert.equal(backupArg(['--backup', 'package.json']), 'package.json');
});
