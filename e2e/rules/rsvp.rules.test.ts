import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const projectId = 'organizaai-rsvp-rules';
let testEnvironment: RulesTestEnvironment;

function primaryGuest(uid: string) {
  return {
    uid,
    name: 'Carlos Silva',
    phone: '11999998888',
    companionsCount: 0,
    isConfirmed: true,
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
afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('verified RSVP Firestore rules contract', () => {
  it('allows a verified primary attendee to create their own complete RSVP', async () => {
    const db = testEnvironment.authenticatedContext('verified-user').firestore();

    await assertSucceeds(
      setDoc(doc(db, 'events/event-1/guests/verified-user'), primaryGuest('verified-user')),
    );

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const snapshot = await context.firestore().collection('events/event-1/guests').get();
      expect(snapshot.docs.map((entry) => entry.data())).toEqual([primaryGuest('verified-user')]);
    });
  });

  it('denies a primary RSVP whose uid does not match the authenticated attendee', async () => {
    const db = testEnvironment.authenticatedContext('verified-user').firestore();

    await assertFails(
      setDoc(doc(db, 'events/event-1/guests/another-user'), primaryGuest('another-user')),
    );
  });

  it('denies a primary RSVP without the legacy aggregate count', async () => {
    const db = testEnvironment.authenticatedContext('verified-user').firestore();
    const { companionsCount: _companionsCount, ...missingCount } = primaryGuest('verified-user');

    await assertFails(
      setDoc(doc(db, 'events/event-1/guests/verified-user'), missingCount),
    );
  });

  it('characterizes the current rejection of linked family records without verified-primary fields', async () => {
    const db = testEnvironment.authenticatedContext('verified-user').firestore();

    await assertFails(
      setDoc(doc(db, 'events/event-1/guests/verified-user-family-1'), {
        name: 'Mariana Silva',
        primaryGuestId: 'verified-user',
        phone: '11988887777',
        isConfirmed: true,
      }),
    );
  });
});
