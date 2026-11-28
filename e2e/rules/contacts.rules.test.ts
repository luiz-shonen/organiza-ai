import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'organizaai-contacts-rules';
let testEnvironment: RulesTestEnvironment;

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

/**
 * Event `e`: owned by `owner`, helped by `collab`; `guest` confirmed with their account and
 * already shared their phone with both. `stranger` has nothing to do with it.
 */
beforeEach(async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'events/e'), {
      title: 'Natal',
      createdBy: 'owner',
      collaborators: ['collab'],
    });
    await setDoc(doc(db, 'events/e/guests/guest'), {
      uid: 'guest',
      phone: '(11) 98888-7777',
      companionsCount: 0,
      isConfirmed: true,
    });
    await setDoc(doc(db, 'events/other'), { title: 'Outro', createdBy: 'stranger' });
    await setDoc(doc(db, 'contacts/guest'), {
      phone: '(11) 98888-7777',
      phoneVisibleTo: ['owner', 'collab'],
    });
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('contacts/{uid} Firestore rules contract', () => {
  it('lets the owner and the organizers on the list read the phone, nobody else', async () => {
    await assertSucceeds(getDoc(doc(accountDb('guest'), 'contacts/guest')));
    await assertSucceeds(getDoc(doc(accountDb('owner'), 'contacts/guest')));
    await assertSucceeds(getDoc(doc(accountDb('collab'), 'contacts/guest')));
    await assertFails(getDoc(doc(accountDb('stranger'), 'contacts/guest')));
    await assertFails(
      getDoc(doc(testEnvironment.unauthenticatedContext().firestore(), 'contacts/guest')),
    );
  });

  it('lets the owner save their phone and share it with the organizers on confirming', async () => {
    const guest = accountDb('new-guest');
    await assertSucceeds(
      setDoc(
        doc(guest, 'contacts/new-guest'),
        { phone: '(21) 97777-6666', phoneVisibleTo: arrayUnion('owner', 'collab') },
        { merge: true },
      ),
    );
    await assertFails(setDoc(doc(guest, 'contacts/new-guest'), { phone: 'not a phone' }));
    await assertFails(
      setDoc(doc(guest, 'contacts/new-guest'), { phone: '(21) 97777-6666', email: 'x@y.z' }),
    );
    await assertFails(setDoc(doc(accountDb('owner'), 'contacts/someone'), { phone: '' }));
  });

  it('lets a collaborator who joined add only themself, through an event the person answered', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'events/e'), {
        collaborators: ['collab', 'joined'],
      });
    });
    const joined = accountDb('joined');
    await assertSucceeds(
      updateDoc(doc(joined, 'contacts/guest'), {
        phoneVisibleTo: arrayUnion('joined'),
        grantedVia: 'e',
      }),
    );
    // Someone else, or through an event they do not organize, or one the person never answered.
    await assertFails(
      updateDoc(doc(joined, 'contacts/guest'), {
        phoneVisibleTo: arrayUnion('stranger'),
        grantedVia: 'e',
      }),
    );
    await assertFails(
      updateDoc(doc(accountDb('stranger'), 'contacts/guest'), {
        phoneVisibleTo: arrayUnion('stranger'),
        grantedVia: 'other',
      }),
    );
    await assertFails(
      updateDoc(doc(accountDb('stranger'), 'contacts/guest'), {
        phoneVisibleTo: arrayUnion('stranger'),
        grantedVia: 'e',
      }),
    );
  });

  it('never lets someone else change the phone itself', async () => {
    await assertFails(
      updateDoc(doc(accountDb('owner'), 'contacts/guest'), {
        phone: '(11) 90000-0000',
        grantedVia: 'e',
      }),
    );
  });

  it('lets the owner take out a removed collaborator, never one who still organizes', async () => {
    const owner = accountDb('owner');
    await assertFails(
      updateDoc(doc(owner, 'contacts/guest'), {
        phoneVisibleTo: arrayRemove('collab'),
        grantedVia: 'e',
      }),
    );
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'events/e'), { collaborators: [] });
    });
    await assertSucceeds(
      updateDoc(doc(owner, 'contacts/guest'), {
        phoneVisibleTo: arrayRemove('collab'),
        grantedVia: 'e',
      }),
    );
  });

  it('lets anyone take only themself out of the list', async () => {
    await assertSucceeds(
      updateDoc(doc(accountDb('collab'), 'contacts/guest'), {
        phoneVisibleTo: arrayRemove('collab'),
      }),
    );
    await assertFails(
      updateDoc(doc(accountDb('stranger'), 'contacts/guest'), {
        phoneVisibleTo: arrayRemove('owner'),
      }),
    );
  });
});
