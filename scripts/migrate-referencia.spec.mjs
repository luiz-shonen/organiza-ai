import assert from 'node:assert/strict';
import test from 'node:test';
import {
  apply,
  backupArg,
  isAccountGuest,
  planEvent,
  planNotifications,
  planSecretSanta,
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

test('migrate-referencia: amigo oculto moves phones apart, links to ids, format last', () => {
  const event = { id: 'e1', data: { createdBy: 'owner', collaborators: [] } };
  const writes = planSecretSanta(event, {
    participants: [
      { id: 'rsvp_ana', joinedBy: 'ana', name: 'Ana', phone: '(11) 9', giftOptions: [] },
      { id: 'rsvp_ana_f_vo', joinedBy: 'ana', name: 'Vó', phone: '(11) 8', giftOptions: [] },
      { id: 'own', guestId: 'owner', name: 'Jéssica', phone: '(11) 7', giftOptions: [] },
    ],
    draw: {
      links: [
        {
          participantId: 'rsvp_ana_f_vo',
          name: 'Vó',
          phone: '(11) 8',
          token: 't1',
          receiverId: 'own',
        },
      ],
    },
    reveals: [
      {
        token: 't1',
        data: { eventId: 'e1', giverName: 'Vó', receiverName: 'Jéssica', receiverGiftOptions: [] },
        result: { eventId: 'e1', receiverName: 'Jéssica', receiverGiftOptions: [] },
      },
      {
        token: 't2',
        data: { eventId: 'e1', giverName: 'Vó', receiverName: '', openedAt: 'x', replaces: 't1' },
        result: null,
      },
    ],
  });
  const paths = writes.map((w) => w.path);
  // Only the relative's phone moves; the accounts' own come from their contacts.
  assert.deepEqual(
    writes.filter((w) => w.path.includes('secretSantaPhones')),
    [{ path: 'events/e1/secretSantaPhones/rsvp_ana_f_vo', onlyIfMissing: { phone: '(11) 8' } }],
  );
  assert.ok(paths.includes('events/e1/secretSantaParticipants/rsvp_ana'));
  assert.deepEqual(writes.find((w) => w.path === 'events/e1/secretSanta/draw').set, {
    links: [{ participantId: 'rsvp_ana_f_vo', token: 't1', receiverId: 'own' }],
  });
  assert.deepEqual(writes.find((w) => w.path === 'secretSantaReveals/t1').set, {
    giverId: 'rsvp_ana_f_vo',
    receiverId: 'own',
  });
  // A renewed link already opened, without an account: no longer says whom they drew.
  assert.equal(writes.find((w) => w.path === 'secretSantaReveals/t2').set.receiverId, '');
  assert.deepEqual(writes.find((w) => w.path.endsWith('t1/private/result')).set, {
    receiverId: 'own',
  });
  assert.deepEqual(writes.at(-1), { path: 'events/e1', set: { secretSantaFormat: 2 } });
});

test('migrate-referencia: an amigo oculto already in the new format plans nothing', () => {
  const writes = planSecretSanta(
    { id: 'e1', data: { createdBy: 'owner', secretSantaFormat: 2 } },
    {
      participants: [{ id: 'p', name: 'Vó', giftOptions: [] }],
      draw: { links: [{ participantId: 'p', token: 't', receiverId: 'q' }] },
      reveals: [
        { token: 't', data: { eventId: 'e1', giverId: 'p', receiverId: 'q' }, result: null },
      ],
    },
  );
  assert.deepEqual(writes, []);
});
