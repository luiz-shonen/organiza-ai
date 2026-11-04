import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const projectId = 'organizaai-events-rules';
let testEnvironment: RulesTestEnvironment;

const adminEmail = 'admin@organizaai.test';

function accountDb(uid: string, email: string, provider = 'password') {
  return testEnvironment
    .authenticatedContext(uid, { email, firebase: { sign_in_provider: provider } })
    .firestore();
}

async function seed(path: string, data: Record<string, unknown>): Promise<void> {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

const ownedEvent = { title: 'Casamento', createdBy: 'owner-uid', collaborators: [] };

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

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('events collection Firestore rules contract', () => {
  it('allows public unauthenticated read of events', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1'), {
        title: 'Churrasco da Turma',
        date: '2026-10-10',
        location: 'Rua das Flores, 123',
      });
    });

    const unauthDb = testEnvironment.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(unauthDb, 'events/event-1')));
  });

  it('keeps events private: the invite link opens one event, listing shows only your own', async () => {
    await seed('events/festa-junina', { ...ownedEvent, title: 'Festa Junina' });
    await seed('events/natal', { ...ownedEvent, title: 'Natal' });
    await seed('events/churrasco', {
      title: 'Churrasco',
      createdBy: 'other-uid',
      collaborators: ['guest-uid'],
    });
    const guestDb = accountDb('guest-uid', 'guest@organizaai.test');

    await assertSucceeds(getDoc(doc(guestDb, 'events/festa-junina')));
    await assertFails(getDocs(collection(guestDb, 'events')));
    await assertFails(
      getDocs(query(collection(guestDb, 'events'), where('createdBy', '==', 'owner-uid'))),
    );
    await assertFails(
      getDocs(collection(testEnvironment.unauthenticatedContext().firestore(), 'events')),
    );

    await assertSucceeds(
      getDocs(query(collection(guestDb, 'events'), where('createdBy', '==', 'guest-uid'))),
    );
    const collaborated = await assertSucceeds(
      getDocs(
        query(collection(guestDb, 'events'), where('collaborators', 'array-contains', 'guest-uid')),
      ),
    );
    expect(collaborated.docs.map((d) => d.id)).toEqual(['churrasco']);
  });

  it('lets an account find only its own answers across events', async () => {
    await seed('events/festa-junina/guests/guest-uid', { uid: 'guest-uid', name: 'Bia' });
    await seed('events/natal/guests/other-uid', { uid: 'other-uid', name: 'Caio' });
    const guestDb = accountDb('guest-uid', 'guest@organizaai.test');

    const mine = await assertSucceeds(
      getDocs(query(collectionGroup(guestDb, 'guests'), where('uid', '==', 'guest-uid'))),
    );
    expect(mine.docs.map((d) => d.ref.parent.parent?.id)).toEqual(['festa-junina']);
    await assertFails(getDocs(collectionGroup(guestDb, 'guests')));
  });

  it('allows admin to create, update, and delete events', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `admins/${adminEmail}`), { role: 'admin' });
    });

    const adminDb = testEnvironment
      .authenticatedContext('admin-uid', { email: adminEmail })
      .firestore();

    const eventDoc = doc(adminDb, 'events/event-1');

    await assertSucceeds(
      setDoc(eventDoc, {
        title: 'Churrasco',
        date: '2026-10-10',
      }),
    );

    await assertSucceeds(
      updateDoc(eventDoc, {
        title: 'Churrasco Atualizado',
      }),
    );

    await assertSucceeds(deleteDoc(eventDoc));
  });

  it('denies non-admin from creating, updating, or deleting events', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1'), {
        title: 'Churrasco',
        date: '2026-10-10',
      });
    });

    const userDb = testEnvironment
      .authenticatedContext('regular-uid', { email: 'regular@test.com' })
      .firestore();

    const eventDoc = doc(userDb, 'events/event-1');
    const newEventDoc = doc(userDb, 'events/event-2');

    await assertFails(
      setDoc(newEventDoc, {
        title: 'Festa Inválida',
      }),
    );

    await assertFails(
      updateDoc(eventDoc, {
        title: 'Hackeado',
      }),
    );

    await assertFails(deleteDoc(eventDoc));
  });

  it('lets any account holder create an event they own, with no pixKey', async () => {
    const db = accountDb('owner-uid', 'owner@test.com');
    await assertSucceeds(
      setDoc(doc(db, 'events/new-event'), { ...ownedEvent, pixKey: null, creatorName: '' }),
    );
  });

  it("refuses an event created in someone else's name or by an anonymous guest", async () => {
    await assertFails(setDoc(doc(accountDb('intruder-uid', 'x@test.com'), 'events/e'), ownedEvent));
    await assertFails(setDoc(doc(accountDb('owner-uid', '', 'anonymous'), 'events/e'), ownedEvent));
  });

  it('lets only the owner edit and delete the event, never hand it over', async () => {
    await seed('events/e', ownedEvent);
    const owner = accountDb('owner-uid', 'owner@test.com');
    const other = accountDb('other-uid', 'other@test.com');

    await assertSucceeds(updateDoc(doc(owner, 'events/e'), { title: 'Casamento da Ana' }));
    await assertFails(updateDoc(doc(owner, 'events/e'), { createdBy: 'other-uid' }));
    await assertFails(updateDoc(doc(other, 'events/e'), { title: 'Hackeado' }));
    await assertFails(deleteDoc(doc(other, 'events/e')));
    await assertSucceeds(deleteDoc(doc(owner, 'events/e')));
  });

  it('lets an invited account join as collaborator once, adding only itself', async () => {
    await seed('events/e', ownedEvent);
    await seed('events/e/invitations/guest@test.com', { invitedEmail: 'guest@test.com' });
    const invited = accountDb('guest-uid', 'Guest@test.com');
    const stranger = accountDb('stranger-uid', 'stranger@test.com');

    await assertFails(
      updateDoc(doc(stranger, 'events/e'), { collaborators: arrayUnion('stranger-uid') }),
    );
    await assertFails(
      updateDoc(doc(invited, 'events/e'), { collaborators: arrayUnion('guest-uid', 'x') }),
    );
    await assertFails(
      updateDoc(doc(invited, 'events/e'), { collaborators: arrayUnion('guest-uid'), title: 'x' }),
    );

    const batch = writeBatch(invited);
    batch.update(doc(invited, 'events/e'), {
      collaborators: arrayUnion('guest-uid'),
      updatedAt: '2026-11-03T00:00:00.000Z',
    });
    batch.delete(doc(invited, 'events/e/invitations/guest@test.com'));
    await assertSucceeds(batch.commit());
  });

  it('lets the owner invite and the collaborators manage items', async () => {
    await seed('events/e', { ...ownedEvent, collaborators: ['collab-uid'] });
    const owner = accountDb('owner-uid', 'owner@test.com');
    const collab = accountDb('collab-uid', 'collab@test.com');
    const other = accountDb('other-uid', 'other@test.com');

    await assertSucceeds(
      setDoc(doc(owner, 'events/e/invitations/new@test.com'), { invitedEmail: 'new@test.com' }),
    );
    await assertFails(
      setDoc(doc(other, 'events/e/invitations/me@test.com'), { invitedEmail: 'me@test.com' }),
    );
    await assertSucceeds(
      setDoc(doc(owner, 'events/e/items/i1'), { name: 'Bolo', claimedBy: null }),
    );
    await assertSucceeds(updateDoc(doc(collab, 'events/e/items/i1'), { name: 'Bolo de fubá' }));
    await assertFails(setDoc(doc(other, 'events/e/items/i2'), { name: 'Pizza', claimedBy: null }));
    await assertSucceeds(deleteDoc(doc(collab, 'events/e/items/i1')));
  });
});
