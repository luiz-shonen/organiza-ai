import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const projectId = 'organizaai-events-rules';
let testEnvironment: RulesTestEnvironment;

const adminEmail = 'admin@organizaai.test';

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
});
