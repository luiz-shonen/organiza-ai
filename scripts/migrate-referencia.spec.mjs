import assert from 'node:assert/strict';
import test from 'node:test';
import { planEvent, planNotifications, summarize, isAccountGuest } from './migrate-referencia.mjs';

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
