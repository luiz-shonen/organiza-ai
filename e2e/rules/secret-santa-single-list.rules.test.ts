import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

/**
 * The amigo oculto as one list: everyone reads names and ideas, phones live apart
 * (`secretSantaPhones`), and secret links keep only ids.
 */
const projectId = 'organizaai-secret-santa-single-list-rules';
let testEnvironment: RulesTestEnvironment;

function accountDb(uid: string) {
  return testEnvironment
    .authenticatedContext(uid, {
      email: `${uid}@test.com`,
      firebase: { sign_in_provider: 'google.com' },
    })
    .firestore();
}

const visitorDb = () => testEnvironment.unauthenticatedContext().firestore();
const list = 'events/e/secretSantaParticipants';

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
    const db = context.firestore();
    await setDoc(doc(db, 'events/e'), {
      title: 'Natal',
      createdBy: 'owner',
      collaborators: [],
      secretSantaFormat: 2,
      secretSanta: { enabled: true, giftOptions: true, maxGiftOptions: 3 },
    });
    await setDoc(doc(db, `${list}/vo`), { name: 'Vó Lurdes', giftOptions: ['Manta'] });
    await setDoc(doc(db, 'events/e/secretSantaPhones/vo'), { phone: '(11) 97777-0000' });
    await setDoc(doc(db, 'events/old'), {
      title: 'Antigo',
      createdBy: 'owner',
      collaborators: [],
      secretSanta: { enabled: true, giftOptions: true },
    });
    await setDoc(doc(db, 'events/old/secretSantaParticipants/p'), {
      name: 'Tia',
      phone: '(11) 96666-0000',
      giftOptions: [],
    });
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('amigo oculto: one list, phones apart, links by id', () => {
  it('lets any account read the list, and anyone an entry, once phones live apart', async () => {
    await assertSucceeds(getDocs(collection(accountDb('guest'), list)));
    await assertSucceeds(getDoc(doc(visitorDb(), `${list}/vo`)));
    await assertFails(getDocs(collection(visitorDb(), list)));
  });

  it('keeps an older list (phones inside) closed to guests until the phones move', async () => {
    await assertFails(
      getDocs(collection(accountDb('guest'), 'events/old/secretSantaParticipants')),
    );
    await assertFails(getDoc(doc(visitorDb(), 'events/old/secretSantaParticipants/p')));
  });

  it('keeps the phones to organizers, and a guest to the phones of their own entries', async () => {
    await assertSucceeds(getDoc(doc(accountDb('owner'), 'events/e/secretSantaPhones/vo')));
    await assertFails(getDoc(doc(accountDb('guest'), 'events/e/secretSantaPhones/vo')));
    await assertSucceeds(
      setDoc(doc(accountDb('guest'), 'events/e/secretSantaPhones/rsvp_guest_c_bia'), {
        phone: '(11) 95555-0000',
      }),
    );
    await assertFails(
      setDoc(doc(accountDb('guest'), 'events/e/secretSantaPhones/rsvp_other_c_bia'), {
        phone: '(11) 95555-0000',
      }),
    );
  });

  it('refuses a phone written into the list, and lets an account join with no name', async () => {
    const owner = accountDb('owner');
    await assertFails(
      setDoc(doc(owner, `${list}/typed`), {
        name: 'Tio',
        phone: '(11) 94444-0000',
        giftOptions: [],
      }),
    );
    await assertSucceeds(setDoc(doc(owner, `${list}/typed`), { name: 'Tio', giftOptions: [] }));
    await assertFails(setDoc(doc(owner, `${list}/nameless`), { giftOptions: [] }));
    await assertSucceeds(
      setDoc(doc(owner, `${list}/own`), { giftOptions: ['Livro'], guestId: 'owner' }),
    );
    await assertSucceeds(
      setDoc(doc(accountDb('guest'), `${list}/rsvp_guest`), {
        giftOptions: ['Caneca'],
        guestId: 'guest',
        joinedBy: 'guest',
      }),
    );
  });

  it('never lets the app turn the new format on for an older event', async () => {
    await assertFails(updateDoc(doc(accountDb('owner'), 'events/old'), { secretSantaFormat: 2 }));
  });

  it('draws by id, and opening a link without an account erases whom they drew, once', async () => {
    const owner = accountDb('owner');
    const batch = writeBatch(owner);
    batch.set(doc(owner, 'secretSantaReveals/tok-1'), {
      eventId: 'e',
      giverId: 'vo',
      receiverId: 'own',
      createdAt: '2026-11-28T10:00:00.000Z',
    });
    batch.set(doc(owner, 'secretSantaReveals/tok-1/private/result'), {
      eventId: 'e',
      receiverId: 'own',
    });
    await assertSucceeds(batch.commit());

    const holder = visitorDb();
    await assertFails(updateDoc(doc(holder, 'secretSantaReveals/tok-1'), { openedAt: 'now' }));
    await assertSucceeds(
      updateDoc(doc(holder, 'secretSantaReveals/tok-1'), {
        openedAt: '2026-11-28T11:00:00.000Z',
        receiverId: '',
      }),
    );
    await assertFails(
      updateDoc(doc(holder, 'secretSantaReveals/tok-1'), {
        openedAt: '2026-11-28T12:00:00.000Z',
        receiverId: '',
      }),
    );
  });

  it('renews a spent link by id, with the same giver and person drawn', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'secretSantaReveals/old'), {
        eventId: 'e',
        giverId: 'vo',
        receiverId: '',
        createdAt: '2026-11-28T10:00:00.000Z',
        openedAt: '2026-11-28T11:00:00.000Z',
      });
      await setDoc(doc(db, 'secretSantaReveals/old/private/result'), {
        eventId: 'e',
        receiverId: 'own',
      });
    });
    const holder = visitorDb();
    const renew = (receiverId: string) => {
      const batch = writeBatch(holder);
      batch.set(doc(holder, 'secretSantaReveals/new'), {
        eventId: 'e',
        giverId: 'vo',
        receiverId,
        createdAt: '2026-11-28T12:00:00.000Z',
        replaces: 'old',
      });
      batch.set(doc(holder, 'secretSantaReveals/new/private/result'), {
        eventId: 'e',
        receiverId,
      });
      batch.update(doc(holder, 'secretSantaReveals/old'), { replacedBy: 'new' });
      return batch.commit();
    };
    await assertFails(renew('someone-else'));
    await assertSucceeds(renew('own'));
  });
});
