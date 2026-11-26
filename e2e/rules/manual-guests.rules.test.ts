import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
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
  it('keeps the relatives of someone added by hand on the event, tied to them', async () => {
    const relative = (addedBy: string, primaryGuestId = 'm1') => ({
      name: 'Lia',
      relationship: 'child',
      phone: '',
      primaryGuestId,
      isConfirmed: true,
      confirmedAt: '2026-11-24T10:00:00.000Z',
      addedBy,
    });
    const db = accountDb('owner-uid');
    // The person and a relative in one batch.
    const batch = writeBatch(db);
    batch.set(doc(db, 'events/e/guests/m1'), manualGuest('owner-uid'));
    batch.set(doc(db, 'events/e/guests/m1_r1'), relative('owner-uid'));
    await assertSucceeds(batch.commit());
    // A collaborator adds and edits another later.
    const collab = accountDb('collab-uid');
    await assertSucceeds(setDoc(doc(collab, 'events/e/guests/m1_r2'), relative('collab-uid')));
    await assertSucceeds(
      updateDoc(doc(collab, 'events/e/guests/m1_r1'), {
        name: 'Lia Souza',
        relationship: 'spouse',
      }),
    );
    // Not who added it, an id not starting with the person's, a bad kinship or someone else.
    await assertFails(updateDoc(doc(collab, 'events/e/guests/m1_r1'), { addedBy: 'collab-uid' }));
    await assertFails(setDoc(doc(db, 'events/e/guests/other_r3'), relative('owner-uid')));
    await assertFails(
      setDoc(doc(db, 'events/e/guests/m1_r4'), { ...relative('owner-uid'), relationship: 'boss' }),
    );
    await assertFails(
      setDoc(doc(accountDb('guest-uid'), 'events/e/guests/m1_r5'), relative('guest-uid')),
    );
    // Only under someone added by hand, never under a guest's own answer.
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/e/guests/acc'), {
        uid: 'acc',
        name: 'Bia',
        phone: '(11) 98888-2222',
        companionsCount: 0,
      });
    });
    await assertFails(setDoc(doc(db, 'events/e/guests/acc_r1'), relative('owner-uid', 'acc')));
    await assertSucceeds(deleteDoc(doc(db, 'events/e/guests/m1_r1')));
  });
});
