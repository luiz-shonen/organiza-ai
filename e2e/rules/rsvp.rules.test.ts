import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const projectId = 'organizaai-rsvp-rules';
let testEnvironment: RulesTestEnvironment;

function primaryGuest(uid: string, companionNames: string[] = []) {
  return {
    uid,
    name: 'Carlos Silva',
    phone: '11999998888',
    companions: companionNames.map((name) => ({ name })),
    companionsCount: companionNames.length,
    isConfirmed: true,
  };
}

function linkedFamilyGuest(primaryGuestId: string) {
  return {
    name: 'Mariana Silva',
    primaryGuestId,
    phone: '11988887777',
    isConfirmed: true,
    confirmedAt: '2026-08-21T00:00:00.000Z',
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

  it('allows one atomic batch with a named primary RSVP and linked family record', async () => {
    const db = testEnvironment.authenticatedContext('verified-user').firestore();
    const batch = writeBatch(db);

    batch.set(
      doc(db, 'events/event-1/guests/verified-user'),
      primaryGuest('verified-user', ['Ana', 'Bia', 'Caio']),
    );
    batch.set(
      doc(db, 'events/event-1/guests/verified-user-family-1'),
      linkedFamilyGuest('verified-user'),
    );

    await assertSucceeds(batch.commit());
  });

  it('denies a linked family record for another verified primary', async () => {
    const db = testEnvironment.authenticatedContext('verified-user').firestore();

    await assertFails(
      setDoc(
        doc(db, 'events/event-1/guests/verified-user-family-1'),
        linkedFamilyGuest('another-verified-user'),
      ),
    );
  });

  it('allows the verified primary to cancel its primary and linked family records atomically', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'events/event-1/guests/verified-user'), primaryGuest('verified-user'));
      await setDoc(
        doc(db, 'events/event-1/guests/verified-user-family-1'),
        linkedFamilyGuest('verified-user'),
      );
    });

    const db = testEnvironment.authenticatedContext('verified-user').firestore();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'events/event-1/guests/verified-user'));
    batch.delete(doc(db, 'events/event-1/guests/verified-user-family-1'));

    await assertSucceeds(batch.commit());

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await expect(context.firestore().collection('events/event-1/guests').get()).resolves.toMatchObject({
        empty: true,
      });
    });
  });
});
