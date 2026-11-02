import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const projectId = 'organizaai-claims-rules';
let testEnvironment: RulesTestEnvironment;

const claimsDoc = {
  name: 'Jéssica',
  entries: [{ itemId: 'item-1', memberId: null, who: 'Jéssica', quantity: 2, bought: false }],
  updatedAt: '2026-11-01T00:00:00.000Z',
};

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

describe('household claims Firestore rules contract', () => {
  it('lets anyone read the claims of an event', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1/claims/user-1'), claimsDoc);
    });

    const unauthDb = testEnvironment.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(unauthDb, 'events/event-1/claims/user-1')));
  });

  it('lets a person write and delete only their own household document', async () => {
    const ownDb = testEnvironment.authenticatedContext('user-1').firestore();
    await assertSucceeds(setDoc(doc(ownDb, 'events/event-1/claims/user-1'), claimsDoc));
    await assertSucceeds(deleteDoc(doc(ownDb, 'events/event-1/claims/user-1')));

    await assertFails(setDoc(doc(ownDb, 'events/event-1/claims/user-2'), claimsDoc));
  });

  it('rejects anonymous writes and unexpected fields', async () => {
    const unauthDb = testEnvironment.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(unauthDb, 'events/event-1/claims/user-1'), claimsDoc));

    const ownDb = testEnvironment.authenticatedContext('user-1').firestore();
    await assertFails(
      setDoc(doc(ownDb, 'events/event-1/claims/user-1'), { ...claimsDoc, isAdmin: true }),
    );
  });
});
