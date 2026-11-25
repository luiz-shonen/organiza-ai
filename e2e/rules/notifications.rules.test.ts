import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'organizaai-notifications-rules';
let testEnvironment: RulesTestEnvironment;

const notice = {
  kind: 'secret-santa',
  eventId: 'e',
  eventTitle: 'Natal 2026',
  title: 'Sorteio do amigo oculto feito!',
  body: 'Confira quem você tirou no amigo oculto de Natal 2026.',
  actionLabel: 'Ver quem eu tirei',
  actionUrl: '/amigo-oculto/50bf7e73-5564-40d4-bdb6-94bbd701fa25',
  createdAt: '2026-11-16T21:00:00.000Z',
  readAt: null,
};
const path = 'users/guest-uid/notifications/secret-santa_e';

function accountDb(uid: string) {
  return testEnvironment
    .authenticatedContext(uid, {
      email: `${uid}@test.com`,
      firebase: { sign_in_provider: 'password' },
    })
    .firestore();
}

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: await readFile(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8088,
    },
  });
});

beforeEach(async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'events/e'), {
      title: 'Natal 2026',
      createdBy: 'owner-uid',
      collaborators: ['collab-uid'],
    });
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('in-app notifications Firestore rules contract', () => {
  it('lets the event owner tell a participant about the draw, and send it again', async () => {
    const owner = accountDb('owner-uid');
    await assertSucceeds(setDoc(doc(owner, path), notice));
    await assertSucceeds(setDoc(doc(owner, path), { ...notice, title: 'Seu novo link' }));
  });

  it('refuses a notice from anyone else, for another id, or pointing outside the app', async () => {
    await assertFails(setDoc(doc(accountDb('collab-uid'), path), notice));
    await assertFails(setDoc(doc(accountDb('stranger-uid'), path), notice));
    const owner = accountDb('owner-uid');
    await assertFails(setDoc(doc(owner, 'users/guest-uid/notifications/other'), notice));
    await assertFails(setDoc(doc(owner, path), { ...notice, actionUrl: 'https://evil.test' }));
    await assertFails(setDoc(doc(owner, path), { ...notice, title: '<script>' }));
    await assertFails(setDoc(doc(owner, path), { ...notice, readAt: 'already' }));
    await assertFails(setDoc(doc(owner, path), { ...notice, extra: true }));
  });

  it('keeps the inbox private: only the member reads it, marks it read and dismisses it', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), path), notice);
    });
    const guest = accountDb('guest-uid');
    await assertSucceeds(getDocs(collection(guest, 'users/guest-uid/notifications')));
    await assertFails(getDocs(collection(accountDb('owner-uid'), 'users/guest-uid/notifications')));
    await assertSucceeds(updateDoc(doc(guest, path), { readAt: '2026-11-16T22:00:00.000Z' }));
    await assertFails(updateDoc(doc(guest, path), { title: 'Outro' }));
    await assertSucceeds(deleteDoc(doc(guest, path)));
  });

  it('lets the member keep their own answered invite in the history, nobody else', async () => {
    const record = {
      kind: 'collaborator',
      eventId: 'e',
      eventTitle: 'Natal',
      title: 'Você aceitou colaborar',
      body: 'Natal · por Jéssica',
      actionLabel: 'Ver evento',
      actionUrl: '/evento/e',
      createdAt: '2026-11-22T10:00:00.000Z',
      readAt: '2026-11-22T10:00:00.000Z',
    };
    const own = 'users/guest-uid/notifications/collaborator_e';
    await assertSucceeds(setDoc(doc(accountDb('guest-uid'), own), record));
    await assertFails(setDoc(doc(accountDb('owner-uid'), own), record));
    await assertFails(
      setDoc(doc(accountDb('guest-uid'), own), { ...record, actionUrl: 'https://x.com' }),
    );
  });
});

describe('notices between the people of an event', () => {
  const presence = {
    kind: 'presence',
    eventId: 'e',
    eventTitle: 'Natal 2026',
    title: 'Ana confirmou presença',
    body: 'Natal 2026 · com 2 acompanhantes',
    actionLabel: 'Ver convidados',
    actionUrl: '/evento/e',
    createdAt: '2026-11-24T10:00:00.000Z',
    readAt: null,
    actorUid: 'guest-uid',
    actorName: 'Ana',
  };
  const toOwner = 'users/owner-uid/notifications/presence_e_guest-uid';

  it('lets a guest tell each organizer they answered, and answer again', async () => {
    const guest = accountDb('guest-uid');
    await assertSucceeds(setDoc(doc(guest, toOwner), presence));
    await assertSucceeds(
      setDoc(doc(guest, 'users/collab-uid/notifications/presence_e_guest-uid'), presence),
    );
    await assertSucceeds(setDoc(doc(guest, toOwner), { ...presence, title: 'Ana não poderá ir' }));
  });

  it('lets the writer read back only the notice they wrote, for the push relay', async () => {
    const guest = accountDb('guest-uid');
    await assertSucceeds(setDoc(doc(guest, toOwner), presence));
    await assertSucceeds(getDoc(doc(guest, toOwner)));
    await assertFails(getDoc(doc(accountDb('stranger-uid'), toOwner)));
    await assertFails(getDocs(collection(guest, 'users/owner-uid/notifications')));
  });

  it('refuses a notice to someone who does not organize, as someone else, or out of shape', async () => {
    const guest = accountDb('guest-uid');
    await assertFails(
      setDoc(doc(guest, 'users/stranger-uid/notifications/presence_e_guest-uid'), presence),
    );
    await assertFails(
      setDoc(doc(guest, 'users/owner-uid/notifications/presence_e_other'), presence),
    );
    await assertFails(setDoc(doc(guest, toOwner), { ...presence, actorUid: 'other' }));
    await assertFails(setDoc(doc(guest, toOwner), { ...presence, actionUrl: '/evento/x' }));
    await assertFails(setDoc(doc(guest, toOwner), { ...presence, readAt: 'already' }));
    await assertFails(setDoc(doc(guest, toOwner), { ...presence, body: '<b>oi</b>' }));
    await assertFails(
      setDoc(doc(accountDb('owner-uid'), 'users/owner-uid/notifications/presence_e_owner-uid'), {
        ...presence,
        actorUid: 'owner-uid',
      }),
    );
    const anonymous = testEnvironment
      .authenticatedContext('anon-uid', { firebase: { sign_in_provider: 'anonymous' } })
      .firestore();
    await assertFails(
      setDoc(doc(anonymous, 'users/owner-uid/notifications/presence_e_anon-uid'), {
        ...presence,
        actorUid: 'anon-uid',
      }),
    );
  });

  it('lets a collaborator who left tell the owner', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/e'), {
        title: 'Natal 2026',
        createdBy: 'owner-uid',
        collaborators: [],
      });
    });
    await assertSucceeds(
      setDoc(
        doc(accountDb('collab-uid'), 'users/owner-uid/notifications/collaboration_e_collab-uid'),
        {
          ...presence,
          kind: 'collaboration',
          title: 'Bia saiu da colaboração',
          actorUid: 'collab-uid',
          actorName: 'Bia',
        },
      ),
    );
  });

  it('lets an organizer tell a guest who answered that they are in', async () => {
    const approval = {
      ...presence,
      kind: 'approval',
      title: 'Sua presença foi aprovada',
      actorUid: 'collab-uid',
      actorName: 'Bia',
    };
    const toGuest = 'users/guest-uid/notifications/approval_e';
    await assertFails(setDoc(doc(accountDb('collab-uid'), toGuest), approval));
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/e/guests/guest-uid'), { name: 'Ana' });
    });
    await assertSucceeds(setDoc(doc(accountDb('collab-uid'), toGuest), approval));
    await assertFails(
      setDoc(doc(accountDb('stranger-uid'), toGuest), { ...approval, actorUid: 'stranger-uid' }),
    );
  });

  it('keeps the amigo oculto notice working with who sent it', async () => {
    const owner = accountDb('owner-uid');
    await assertSucceeds(setDoc(doc(owner, path), { ...notice, actorUid: 'owner-uid' }));
    await assertSucceeds(getDoc(doc(owner, path)));
    await assertFails(setDoc(doc(owner, path), { ...notice, actorUid: 'guest-uid' }));
  });
});
