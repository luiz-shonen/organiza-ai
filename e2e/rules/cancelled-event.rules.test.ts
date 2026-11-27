import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'organizaai-cancelled-event-rules';
let testEnvironment: RulesTestEnvironment;

function accountDb(uid: string) {
  return testEnvironment
    .authenticatedContext(uid, {
      email: `${uid}@test.com`,
      firebase: { sign_in_provider: 'password' },
    })
    .firestore();
}

const guest = {
  uid: 'guest-uid',
  name: 'Carlos Silva',
  phone: '11999998888',
  companions: [],
  companionsCount: 0,
  isConfirmed: true,
};

function statusNotice(title: string) {
  return {
    kind: 'event-status',
    eventId: 'e',
    eventTitle: 'Natal 2026',
    title,
    body: 'Natal 2026',
    actionLabel: 'Ver evento',
    actionUrl: '/evento/e',
    createdAt: '2026-11-26T12:00:00.000Z',
    readAt: null,
    actorUid: 'owner-uid',
  };
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
    const db = context.firestore();
    await setDoc(doc(db, 'events/e'), {
      title: 'Natal 2026',
      createdBy: 'owner-uid',
      collaborators: ['collab-uid'],
      status: 'cancelled',
      secretSanta: { enabled: true, giftOptions: false },
    });
    await setDoc(doc(db, 'events/e/guests/guest-uid'), guest);
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('a cancelled event is locked until the owner reopens it', () => {
  it('the owner only reopens it: no other change goes through', async () => {
    const owner = accountDb('owner-uid');
    await assertFails(updateDoc(doc(owner, 'events/e'), { title: 'Outro título' }));
    await assertFails(
      updateDoc(doc(owner, 'events/e'), { status: 'active', title: 'Outro título' }),
    );
    await assertSucceeds(updateDoc(doc(owner, 'events/e'), { status: 'active', updatedAt: 'now' }));
    await assertSucceeds(updateDoc(doc(owner, 'events/e'), { title: 'Outro título' }));
  });

  it('nobody draws the amigo oculto, answers or claims while it is cancelled', async () => {
    const owner = accountDb('owner-uid');
    const draw = { drawnAt: 'now', participantIds: ['p1'], links: [] };
    await assertFails(setDoc(doc(owner, 'events/e/secretSanta/draw'), draw));
    await assertFails(
      setDoc(doc(accountDb('other-uid'), 'events/e/guests/other-uid'), {
        ...guest,
        uid: 'other-uid',
      }),
    );
    await assertFails(
      setDoc(doc(accountDb('guest-uid'), 'events/e/claims/guest-uid'), {
        name: 'Carlos',
        entries: [],
        updatedAt: 'now',
      }),
    );

    await updateDoc(doc(owner, 'events/e'), { status: 'active', updatedAt: 'now' });
    await assertSucceeds(setDoc(doc(owner, 'events/e/secretSanta/draw'), draw));
  });

  it('the owner tells guests and collaborators, nobody else', async () => {
    const owner = accountDb('owner-uid');
    const notice = statusNotice('Evento cancelado');
    await assertSucceeds(
      setDoc(doc(owner, 'users/guest-uid/notifications/event-status_e'), notice),
    );
    await assertSucceeds(
      setDoc(doc(owner, 'users/collab-uid/notifications/event-status_e'), notice),
    );
    await assertFails(
      setDoc(doc(owner, 'users/stranger-uid/notifications/event-status_e'), notice),
    );
    await assertFails(
      setDoc(doc(accountDb('collab-uid'), 'users/guest-uid/notifications/event-status_e'), {
        ...notice,
        actorUid: 'collab-uid',
      }),
    );
  });
});
