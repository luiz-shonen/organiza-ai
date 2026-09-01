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

const projectId = 'organizaai-users-admins-rules';
let testEnvironment: RulesTestEnvironment;

const superAdminEmail = 'luiz.gmr.dev@gmail.com';
const regularAdminEmail = 'admin@organizaai.test';
const userEmail = 'user@organizaai.test';

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

describe('users collection Firestore rules contract', () => {
  it('allows authenticated user to read and write their own profile', async () => {
    const userDb = testEnvironment
      .authenticatedContext('user-123', { email: userEmail })
      .firestore();

    const userDoc = doc(userDb, 'users/user-123');

    await assertSucceeds(
      setDoc(userDoc, {
        displayName: 'Lucas Silva',
        email: userEmail,
      }),
    );

    await assertSucceeds(getDoc(userDoc));
  });

  it('denies user from reading or modifying someone elses profile', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-123'), {
        displayName: 'Lucas Silva',
        email: userEmail,
      });
    });

    const otherDb = testEnvironment
      .authenticatedContext('other-uid', { email: 'other@test.com' })
      .firestore();

    const targetDoc = doc(otherDb, 'users/user-123');

    await assertFails(getDoc(targetDoc));
    await assertFails(
      setDoc(targetDoc, {
        displayName: 'Hackeado',
      }),
    );
    await assertFails(deleteDoc(targetDoc));
  });

  it('denies unauthenticated access to user profile', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-123'), {
        displayName: 'Lucas Silva',
      });
    });

    const unauthDb = testEnvironment.unauthenticatedContext().firestore();
    const targetDoc = doc(unauthDb, 'users/user-123');

    await assertFails(getDoc(targetDoc));
    await assertFails(deleteDoc(targetDoc));
  });
});

describe('admins collection Firestore rules contract', () => {
  it('allows SuperAdmin to read and write any admin document', async () => {
    const superAdminDb = testEnvironment
      .authenticatedContext('superadmin-uid', { email: superAdminEmail })
      .firestore();

    const targetAdminDoc = doc(superAdminDb, `admins/${regularAdminEmail}`);

    await assertSucceeds(
      setDoc(targetAdminDoc, {
        role: 'admin',
        grantedAt: '2026-09-01T00:00:00.000Z',
      }),
    );

    await assertSucceeds(getDoc(targetAdminDoc));
    await assertSucceeds(deleteDoc(targetAdminDoc));
  });

  it('allows matching admin to read and write their own admin document', async () => {
    const adminDb = testEnvironment
      .authenticatedContext('admin-uid', { email: regularAdminEmail })
      .firestore();

    const ownAdminDoc = doc(adminDb, `admins/${regularAdminEmail}`);

    await assertSucceeds(
      setDoc(ownAdminDoc, {
        role: 'admin',
      }),
    );

    await assertSucceeds(getDoc(ownAdminDoc));
  });

  it('denies non-admin from reading or modifying another admin document', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `admins/${regularAdminEmail}`), {
        role: 'admin',
      });
    });

    const userDb = testEnvironment
      .authenticatedContext('regular-uid', { email: userEmail })
      .firestore();

    const targetAdminDoc = doc(userDb, `admins/${regularAdminEmail}`);

    await assertFails(getDoc(targetAdminDoc));
    await assertFails(
      setDoc(targetAdminDoc, {
        role: 'admin',
      }),
    );
    await assertFails(deleteDoc(targetAdminDoc));
  });
});
