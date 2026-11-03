import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'organizaai-declines-rules';
let testEnvironment: RulesTestEnvironment;

const decline = { name: 'Jéssica', message: 'Vou estar viajando.', declinedAt: '2026-11-03' };

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
      title: 'Casamento',
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

describe('declines Firestore rules contract', () => {
  it('lets a guest record their own decline with a message, and take it back', async () => {
    const guest = accountDb('guest-uid');
    await assertSucceeds(setDoc(doc(guest, 'events/e/declines/guest-uid'), decline));
    await assertSucceeds(getDoc(doc(guest, 'events/e/declines/guest-uid')));
    await assertSucceeds(deleteDoc(doc(guest, 'events/e/declines/guest-uid')));
  });

  it("refuses a decline in someone else's name, extra fields or markup", async () => {
    const guest = accountDb('guest-uid');
    await assertFails(setDoc(doc(guest, 'events/e/declines/other-uid'), decline));
    await assertFails(
      setDoc(doc(guest, 'events/e/declines/guest-uid'), { ...decline, isAdmin: true }),
    );
    await assertFails(
      setDoc(doc(guest, 'events/e/declines/guest-uid'), { ...decline, message: '<script>' }),
    );
  });

  it('shows the declines to the owner and collaborators only', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/e/declines/guest-uid'), decline);
    });
    await assertSucceeds(getDoc(doc(accountDb('owner-uid'), 'events/e/declines/guest-uid')));
    await assertSucceeds(getDoc(doc(accountDb('collab-uid'), 'events/e/declines/guest-uid')));
    await assertFails(getDoc(doc(accountDb('stranger-uid'), 'events/e/declines/guest-uid')));
  });
});
