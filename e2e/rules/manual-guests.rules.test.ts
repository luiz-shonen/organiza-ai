import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'organizaai-manual-guests-rules';
let testEnvironment: RulesTestEnvironment;

/** Someone the organizers typed in ("Adicionar alguém à mão"). */
function manualGuest(addedBy: string) {
  return {
    name: 'Tia Cida',
    phone: '(11) 98888-1111',
    companions: [{ name: 'Seu Zé' }],
    companionsCount: 1,
    isConfirmed: true,
    confirmedAt: '2026-11-24T10:00:00.000Z',
    addedBy,
  };
}

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
      title: 'Natal',
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

describe('guests added by hand: Firestore rules contract', () => {
  it('lets the owner and a collaborator add, edit and remove someone by hand', async () => {
    for (const uid of ['owner-uid', 'collab-uid']) {
      const db = accountDb(uid);
      const ref = doc(db, `events/e/guests/manual-${uid}`);
      await assertSucceeds(setDoc(ref, manualGuest(uid)));
      await assertSucceeds(
        updateDoc(ref, { name: 'Tia Cida Souza', phone: '', companions: [], companionsCount: 0 }),
      );
      await assertSucceeds(deleteDoc(ref));
    }
  });

  it('refuses a guest, a stranger or someone signed out adding people by hand', async () => {
    await assertFails(
      setDoc(doc(accountDb('guest-uid'), 'events/e/guests/x'), manualGuest('guest-uid')),
    );
    await assertFails(
      setDoc(doc(accountDb('stranger-uid'), 'events/e/guests/x'), manualGuest('stranger-uid')),
    );
    await assertFails(
      setDoc(
        doc(testEnvironment.unauthenticatedContext().firestore(), 'events/e/guests/x'),
        manualGuest('owner-uid'),
      ),
    );
  });

  it('refuses a guest editing or removing someone the organizers added', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/e/guests/m'), manualGuest('owner-uid'));
    });
    const guest = accountDb('guest-uid');
    await assertFails(updateDoc(doc(guest, 'events/e/guests/m'), { name: 'Outra' }));
    await assertFails(deleteDoc(doc(guest, 'events/e/guests/m')));
  });

  it('checks what is typed: name, WhatsApp, companions and no account', async () => {
    const ref = doc(accountDb('owner-uid'), 'events/e/guests/m');
    const base = manualGuest('owner-uid');
    await assertFails(setDoc(ref, { ...base, name: '' }));
    await assertFails(setDoc(ref, { ...base, name: '<b>Cida</b>' }));
    await assertFails(setDoc(ref, { ...base, name: 'x'.repeat(121) }));
    await assertFails(setDoc(ref, { ...base, phone: 'abc' }));
    await assertFails(setDoc(ref, { ...base, companionsCount: 2 }));
    await assertFails(
      setDoc(ref, {
        ...base,
        companions: Array.from({ length: 11 }, (_, i) => ({ name: `P${i}` })),
        companionsCount: 11,
      }),
    );
    // No account behind it, and in the name of whoever added it.
    await assertFails(setDoc(ref, { ...base, uid: 'someone-uid' }));
    await assertFails(setDoc(ref, { ...base, addedBy: 'collab-uid' }));
    await assertSucceeds(setDoc(ref, { ...base, phone: '' }));
  });

  it('keeps an edited entry valid and who added it', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/e/guests/m'), manualGuest('owner-uid'));
    });
    const ref = doc(accountDb('collab-uid'), 'events/e/guests/m');
    await assertFails(updateDoc(ref, { addedBy: 'collab-uid' }));
    await assertFails(updateDoc(ref, { uid: 'collab-uid' }));
    await assertFails(updateDoc(ref, { name: '<script>' }));
    await assertSucceeds(updateDoc(ref, { name: 'Cida' }));
  });

  it('does not let a guest pass their own answer off as added by the organizers', async () => {
    const guest = accountDb('guest-uid');
    await assertFails(
      setDoc(doc(guest, 'events/e/guests/guest-uid'), {
        uid: 'guest-uid',
        name: 'Jéssica',
        phone: '(11) 98888-1111',
        companionsCount: 0,
        addedBy: 'owner-uid',
      }),
    );
    await assertSucceeds(
      setDoc(doc(guest, 'events/e/guests/guest-uid'), {
        uid: 'guest-uid',
        name: 'Jéssica',
        phone: '(11) 98888-1111',
        companionsCount: 0,
      }),
    );
    await assertFails(updateDoc(doc(guest, 'events/e/guests/guest-uid'), { addedBy: 'owner-uid' }));
  });
});
