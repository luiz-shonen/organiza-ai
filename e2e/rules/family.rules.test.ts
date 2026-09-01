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

const projectId = 'organizaai-family-rules';
let testEnvironment: RulesTestEnvironment;

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

describe('family roster Firestore rules contract', () => {
  it('allows authenticated owner to create, read, and delete family member', async () => {
    const db = testEnvironment.authenticatedContext('user-123').firestore();
    const familyMemberDoc = doc(db, 'users/user-123/family/member-1');

    await assertSucceeds(
      setDoc(familyMemberDoc, {
        name: 'Ana Silva',
        relationship: 'daughter',
        phone: '11999998888',
        createdAt: '2026-09-01T00:00:00.000Z',
      }),
    );

    await assertSucceeds(getDoc(familyMemberDoc));
    await assertSucceeds(deleteDoc(familyMemberDoc));
  });

  it('denies a different user from reading or writing someone elses family member', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-123/family/member-1'), {
        name: 'Ana Silva',
        relationship: 'daughter',
        createdAt: '2026-09-01T00:00:00.000Z',
      });
    });

    const otherDb = testEnvironment.authenticatedContext('user-456').firestore();
    const targetDoc = doc(otherDb, 'users/user-123/family/member-1');

    await assertFails(getDoc(targetDoc));
    await assertFails(
      setDoc(targetDoc, {
        name: 'Hacked Silva',
        relationship: 'daughter',
      }),
    );
    await assertFails(deleteDoc(targetDoc));
  });

  it('denies unauthenticated user from accessing family member', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-123/family/member-1'), {
        name: 'Ana Silva',
        relationship: 'daughter',
        createdAt: '2026-09-01T00:00:00.000Z',
      });
    });

    const unauthDb = testEnvironment.unauthenticatedContext().firestore();
    const targetDoc = doc(unauthDb, 'users/user-123/family/member-1');

    await assertFails(getDoc(targetDoc));
    await assertFails(deleteDoc(targetDoc));
  });
});
