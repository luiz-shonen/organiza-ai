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

const projectId = 'organizaai-items-rules';
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

describe('wishlist items Firestore rules contract', () => {
  it('allows public unauthenticated read of items', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1/items/item-1'), {
        title: 'Bolo de Chocolate',
        category: 'food',
        claimedBy: null,
      });
    });

    const unauthDb = testEnvironment.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(unauthDb, 'events/event-1/items/item-1')));
  });

  it('allows admin to create and delete items', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `admins/${adminEmail}`), { role: 'admin' });
    });

    const adminDb = testEnvironment
      .authenticatedContext('admin-uid', { email: adminEmail })
      .firestore();

    const itemDoc = doc(adminDb, 'events/event-1/items/item-1');
    await assertSucceeds(
      setDoc(itemDoc, {
        title: 'Refrigerante',
        category: 'drink',
        claimedBy: null,
      }),
    );

    await assertSucceeds(deleteDoc(itemDoc));
  });

  it('denies non-admin from creating or deleting items', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1/items/item-1'), {
        title: 'Refrigerante',
        category: 'drink',
        claimedBy: null,
      });
    });

    const userDb = testEnvironment.authenticatedContext('user-1').firestore();
    const itemDoc = doc(userDb, 'events/event-1/items/item-1');

    await assertFails(
      setDoc(doc(userDb, 'events/event-1/items/item-2'), {
        title: 'Salgados',
        category: 'food',
      }),
    );
    await assertFails(deleteDoc(itemDoc));
  });

  it('allows authenticated guest to claim an unclaimed item', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1/items/item-1'), {
        title: 'Refrigerante',
        category: 'drink',
        claimedBy: null,
      });
    });

    const guestDb = testEnvironment.authenticatedContext('guest-uid').firestore();
    const itemDoc = doc(guestDb, 'events/event-1/items/item-1');

    await assertSucceeds(
      updateDoc(itemDoc, {
        claimedBy: {
          uid: 'guest-uid',
          name: 'Carlos Silva',
        },
      }),
    );
  });

  it('denies claiming item with a different uid than authenticated user', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1/items/item-1'), {
        title: 'Refrigerante',
        category: 'drink',
        claimedBy: null,
      });
    });

    const guestDb = testEnvironment.authenticatedContext('guest-uid').firestore();
    const itemDoc = doc(guestDb, 'events/event-1/items/item-1');

    await assertFails(
      updateDoc(itemDoc, {
        claimedBy: {
          uid: 'another-uid',
          name: 'Carlos Silva',
        },
      }),
    );
  });

  it('denies claiming an already-claimed item (anti-theft)', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1/items/item-1'), {
        title: 'Refrigerante',
        category: 'drink',
        claimedBy: {
          uid: 'first-guest-uid',
          name: 'Ana',
        },
      });
    });

    const secondGuestDb = testEnvironment.authenticatedContext('second-guest-uid').firestore();
    const itemDoc = doc(secondGuestDb, 'events/event-1/items/item-1');

    await assertFails(
      updateDoc(itemDoc, {
        claimedBy: {
          uid: 'second-guest-uid',
          name: 'Beto',
        },
      }),
    );
  });

  it('allows the claimer to unclaim their reserved item', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1/items/item-1'), {
        title: 'Refrigerante',
        category: 'drink',
        claimedBy: {
          uid: 'guest-uid',
          name: 'Carlos Silva',
        },
      });
    });

    const guestDb = testEnvironment.authenticatedContext('guest-uid').firestore();
    const itemDoc = doc(guestDb, 'events/event-1/items/item-1');

    await assertSucceeds(
      updateDoc(itemDoc, {
        claimedBy: null,
      }),
    );
  });

  it('denies a non-claimer from unclaiming someone elses item', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1/items/item-1'), {
        title: 'Refrigerante',
        category: 'drink',
        claimedBy: {
          uid: 'original-guest-uid',
          name: 'Carlos Silva',
        },
      });
    });

    const otherDb = testEnvironment.authenticatedContext('other-guest-uid').firestore();
    const itemDoc = doc(otherDb, 'events/event-1/items/item-1');

    await assertFails(
      updateDoc(itemDoc, {
        claimedBy: null,
      }),
    );
  });

  it('denies guests from modifying other item fields like title or category during claim', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'events/event-1/items/item-1'), {
        title: 'Refrigerante',
        category: 'drink',
        claimedBy: null,
      });
    });

    const guestDb = testEnvironment.authenticatedContext('guest-uid').firestore();
    const itemDoc = doc(guestDb, 'events/event-1/items/item-1');

    await assertFails(
      updateDoc(itemDoc, {
        title: 'Novo Nome',
        claimedBy: {
          uid: 'guest-uid',
          name: 'Carlos Silva',
        },
      }),
    );
  });
});
