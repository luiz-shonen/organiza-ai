import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const projectId = 'organizaai-invitation-rules';
let testEnvironment: RulesTestEnvironment;

const adminEmail = 'admin@organizaai.test';
const invitedEmail = 'invited@organizaai.test';
const otherEmail = 'other@organizaai.test';

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

describe('collaborator invitation Firestore rules contract', () => {
  it('allows admin to create invitation under event', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `admins/${adminEmail}`), { role: 'admin' });
    });

    const db = testEnvironment.authenticatedContext('admin-uid', { email: adminEmail }).firestore();

    await assertSucceeds(
      setDoc(doc(db, `events/event-1/invitations/${invitedEmail}`), {
        id: invitedEmail,
        eventId: 'event-1',
        eventTitle: 'Festa de Aniversário',
        invitedEmail,
        invitedBy: adminEmail,
        createdAt: '2026-09-01T00:00:00.000Z',
      }),
    );
  });

  it('denies non-admin from creating invitation', async () => {
    const db = testEnvironment
      .authenticatedContext('random-uid', { email: 'random@test.com' })
      .firestore();

    await assertFails(
      setDoc(doc(db, `events/event-1/invitations/${invitedEmail}`), {
        id: invitedEmail,
        eventId: 'event-1',
        eventTitle: 'Festa',
        invitedEmail,
        invitedBy: 'random@test.com',
        createdAt: '2026-09-01T00:00:00.000Z',
      }),
    );
  });

  it('allows the invited user to read and delete their own invitation', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `events/event-1/invitations/${invitedEmail}`), {
        id: invitedEmail,
        eventId: 'event-1',
        invitedEmail,
        createdAt: '2026-09-01T00:00:00.000Z',
      });
    });

    const db = testEnvironment
      .authenticatedContext('invited-uid', { email: invitedEmail })
      .firestore();

    const invDoc = doc(db, `events/event-1/invitations/${invitedEmail}`);

    await assertSucceeds(
      getDocs(query(collectionGroup(db, 'invitations'), where('invitedEmail', '==', invitedEmail))),
    );
    await assertSucceeds(getDoc(invDoc));
    await assertSucceeds(deleteDoc(invDoc));
  });

  it('denies another user from reading or deleting someone elses invitation', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `events/event-1/invitations/${invitedEmail}`), {
        id: invitedEmail,
        eventId: 'event-1',
        invitedEmail,
        createdAt: '2026-09-01T00:00:00.000Z',
      });
    });

    const db = testEnvironment.authenticatedContext('other-uid', { email: otherEmail }).firestore();
    const invDoc = doc(db, `events/event-1/invitations/${invitedEmail}`);

    await assertFails(
      getDocs(query(collectionGroup(db, 'invitations'), where('invitedEmail', '==', invitedEmail))),
    );
    await assertFails(getDoc(invDoc));
    await assertFails(deleteDoc(invDoc));
  });
});
