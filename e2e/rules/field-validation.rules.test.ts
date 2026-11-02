import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const projectId = 'organizaai-field-validation-rules';
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

/** Writes a document as it might already exist, ignoring the rules. */
async function seed(path: string, data: Record<string, unknown>): Promise<void> {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

describe('user profile fields', () => {
  const db = () => testEnvironment.authenticatedContext('user-1').firestore();

  it('accepts what the app saves', async () => {
    await assertSucceeds(
      setDoc(doc(db(), 'users/user-1'), {
        uid: 'user-1',
        displayName: 'Ana Souza',
        name: 'Ana Souza',
        email: 'ana@exemplo.com',
        photoURL: null,
        phone: '(11) 98888-1111',
        themePref: 'dark',
      }),
    );
    await assertSucceeds(updateDoc(doc(db(), 'users/user-1'), { phone: '' }));
  });

  it('accepts a Google account without a display name', async () => {
    await assertSucceeds(
      setDoc(doc(db(), 'users/user-1'), { uid: 'user-1', displayName: null, name: null }),
    );
  });

  it('rejects markup in the name, a phone that is not one and an unknown theme', async () => {
    await assertFails(setDoc(doc(db(), 'users/user-1'), { displayName: '<script>x</script>' }));
    await assertFails(
      setDoc(doc(db(), 'users/user-1'), { phone: '319923123123213123123123123123123' }),
    );
    await assertFails(setDoc(doc(db(), 'users/user-1'), { phone: 'abc' }));
    await assertFails(setDoc(doc(db(), 'users/user-1'), { themePref: 'neon' }));
    await assertFails(setDoc(doc(db(), 'users/user-1'), { name: 'a'.repeat(121) }));
  });

  it('still lets an older profile with a bad phone change other fields', async () => {
    await seed('users/user-1', { displayName: 'Ana', phone: '319923123123213123123123123123123' });

    await assertSucceeds(updateDoc(doc(db(), 'users/user-1'), { themePref: 'light' }));
    await assertFails(updateDoc(doc(db(), 'users/user-1'), { phone: '1'.repeat(30) }));
  });
});

describe('family member fields', () => {
  const memberDoc = () =>
    doc(testEnvironment.authenticatedContext('user-1').firestore(), 'users/user-1/family/m-1');

  it('accepts what the app saves', async () => {
    await assertSucceeds(
      setDoc(memberDoc(), {
        name: 'Lucas Silva',
        relationship: 'child',
        phone: '',
        createdAt: '2026-11-02T00:00:00.000Z',
      }),
    );
    await assertSucceeds(
      updateDoc(memberDoc(), {
        name: 'Lucas Souza',
        relationship: 'child',
        phone: '(11) 3333-4444',
      }),
    );
  });

  it('rejects a missing or unknown relationship, markup in the name and a bad phone', async () => {
    await assertFails(setDoc(memberDoc(), { name: 'Lucas' }));
    await assertFails(setDoc(memberDoc(), { name: 'Lucas', relationship: 'cousin' }));
    await assertFails(setDoc(memberDoc(), { name: 'Lucas <b>', relationship: 'child' }));
    await assertFails(setDoc(memberDoc(), { name: '', relationship: 'child' }));
    await assertFails(
      setDoc(memberDoc(), { name: 'Lucas', relationship: 'child', phone: '{{ 7*7 }}' }),
    );
  });
});

describe('RSVP fields', () => {
  const db = () => testEnvironment.authenticatedContext('guest-1').firestore();
  const primary = {
    uid: 'guest-1',
    name: 'Carlos Silva',
    phone: '(11) 99999-8888',
    companions: [],
    companionsCount: 0,
    isConfirmed: true,
  };

  it('accepts a formatted phone', async () => {
    await assertSucceeds(setDoc(doc(db(), 'events/event-1/guests/guest-1'), primary));
  });

  it('rejects markup in the name and a phone that is too long or not digits', async () => {
    const path = 'events/event-1/guests/guest-1';
    await assertFails(setDoc(doc(db(), path), { ...primary, name: '<img src=x>' }));
    await assertFails(setDoc(doc(db(), path), { ...primary, phone: '1'.repeat(21) }));
    await assertFails(setDoc(doc(db(), path), { ...primary, phone: 'javascript:alert' }));
  });

  it('rejects a linked family record with markup in the name or a bad phone', async () => {
    const linked = {
      name: 'Mariana Silva',
      primaryGuestId: 'guest-1',
      phone: '',
      isConfirmed: true,
      confirmedAt: '2026-11-02T00:00:00.000Z',
    };
    const path = 'events/event-1/guests/guest-1_m-1';
    await assertSucceeds(setDoc(doc(db(), path), linked));
    await assertFails(setDoc(doc(db(), path), { ...linked, name: 'Mariana {x}' }));
    await assertFails(setDoc(doc(db(), path), { ...linked, phone: '1'.repeat(25) }));
  });
});

describe('claims and item claim fields', () => {
  it('rejects markup in the household name', async () => {
    const db = testEnvironment.authenticatedContext('user-1').firestore();
    const claims = { name: 'Ana', entries: [], updatedAt: '2026-11-02T00:00:00.000Z' };
    await assertSucceeds(setDoc(doc(db, 'events/event-1/claims/user-1'), claims));
    await assertFails(
      setDoc(doc(db, 'events/event-1/claims/user-1'), { ...claims, name: '<b>Ana</b>' }),
    );
  });

  it('rejects markup in the name of whoever claims an item', async () => {
    await seed('events/event-1/items/item-1', { name: 'Bolo', quantity: 1, claimedBy: null });
    const db = testEnvironment.authenticatedContext('guest-1').firestore();
    const item = doc(db, 'events/event-1/items/item-1');

    await assertFails(
      updateDoc(item, { claimedBy: { uid: 'guest-1', name: '<script>', phone: '' } }),
    );
    await assertSucceeds(
      updateDoc(item, { claimedBy: { uid: 'guest-1', name: 'Ana', phone: '' } }),
    );
  });
});

describe('event fields', () => {
  it('limits the size of the text an admin saves', async () => {
    await seed(`admins/${adminEmail}`, { email: adminEmail });
    const db = testEnvironment.authenticatedContext('admin-1', { email: adminEmail }).firestore();
    const event = { title: 'Festa Junina', description: 'Arraiá', location: 'Rua A, 1' };

    await assertSucceeds(setDoc(doc(db, 'events/event-1'), event));
    await assertFails(setDoc(doc(db, 'events/event-2'), { ...event, title: 'x'.repeat(201) }));
    await assertFails(setDoc(doc(db, 'events/event-2'), { ...event, title: '' }));
    await assertFails(
      setDoc(doc(db, 'events/event-2'), { ...event, description: 'x'.repeat(2001) }),
    );
  });
});
