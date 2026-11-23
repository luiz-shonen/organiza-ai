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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'organizaai-secret-santa-rules';
let testEnvironment: RulesTestEnvironment;

const participant = { name: 'Jéssica', phone: '(11) 98888-1111', giftOptions: ['Chinelo verde'] };
const reveal = {
  eventId: 'e',
  eventTitle: 'Natal 2026',
  eventDate: '2026-12-24T20:00:00.000Z',
  giverName: 'Jéssica',
  receiverName: 'Luiz',
  receiverGiftOptions: ['Livro'],
  createdAt: '2026-11-16T10:00:00.000Z',
};

function accountDb(uid: string) {
  return testEnvironment
    .authenticatedContext(uid, {
      email: `${uid}@test.com`,
      firebase: { sign_in_provider: 'password' },
    })
    .firestore();
}

function visitorDb() {
  return testEnvironment.unauthenticatedContext().firestore();
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
      title: 'Natal 2026',
      createdBy: 'owner-uid',
      collaborators: ['collab-uid'],
    });
    await setDoc(doc(context.firestore(), 'secretSantaReveals/tok-1'), reveal);
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('secret santa Firestore rules contract', () => {
  it('lets the owner turn the secret santa on, with a well-formed setting only', async () => {
    const owner = accountDb('owner-uid');
    await assertSucceeds(
      updateDoc(doc(owner, 'events/e'), { secretSanta: { enabled: true, giftOptions: false } }),
    );
    await assertFails(
      updateDoc(doc(owner, 'events/e'), { secretSanta: { enabled: 'yes', giftOptions: false } }),
    );
    await assertFails(
      updateDoc(doc(owner, 'events/e'), {
        secretSanta: { enabled: true, giftOptions: false, extra: 1 },
      }),
    );
  });

  it('accepts 1 to 10 gift options per person, chosen by the owner', async () => {
    const owner = accountDb('owner-uid');
    const withLimit = (maxGiftOptions: unknown) =>
      updateDoc(doc(owner, 'events/e'), {
        secretSanta: { enabled: true, giftOptions: true, maxGiftOptions },
      });
    await assertSucceeds(withLimit(1));
    await assertSucceeds(withLimit(10));
    await assertFails(withLimit(0));
    await assertFails(withLimit(11));
    await assertFails(withLimit(2.5));
  });

  it('lets the owner and collaborators manage participants; nobody else sees them', async () => {
    await assertSucceeds(
      setDoc(doc(accountDb('owner-uid'), 'events/e/secretSantaParticipants/p1'), participant),
    );
    await assertSucceeds(
      setDoc(doc(accountDb('collab-uid'), 'events/e/secretSantaParticipants/p2'), participant),
    );
    await assertSucceeds(
      getDocs(collection(accountDb('collab-uid'), 'events/e/secretSantaParticipants')),
    );
    await assertFails(
      getDocs(collection(accountDb('stranger-uid'), 'events/e/secretSantaParticipants')),
    );
    await assertFails(
      setDoc(doc(accountDb('stranger-uid'), 'events/e/secretSantaParticipants/p3'), participant),
    );
    await assertFails(getDoc(doc(visitorDb(), 'events/e/secretSantaParticipants/p1')));
  });

  it('refuses participants with markup, a bad phone, extra fields or too many options', async () => {
    const owner = accountDb('owner-uid');
    const path = 'events/e/secretSantaParticipants/p1';
    await assertFails(setDoc(doc(owner, path), { ...participant, name: '<b>' }));
    await assertFails(setDoc(doc(owner, path), { ...participant, phone: 'abc' }));
    await assertFails(setDoc(doc(owner, path), { ...participant, isAdmin: true }));
    await assertFails(
      setDoc(doc(owner, path), { ...participant, giftOptions: Array(11).fill('Livro') }),
    );
  });

  it('keeps the draw, with every link, to the owner', async () => {
    const draw = { drawnAt: 'now', participantIds: ['p1'], links: [] };
    await assertSucceeds(setDoc(doc(accountDb('owner-uid'), 'events/e/secretSanta/draw'), draw));
    await assertSucceeds(getDoc(doc(accountDb('owner-uid'), 'events/e/secretSanta/draw')));
    await assertFails(getDoc(doc(accountDb('collab-uid'), 'events/e/secretSanta/draw')));
    await assertFails(setDoc(doc(accountDb('collab-uid'), 'events/e/secretSanta/draw'), draw));
    await assertFails(getDoc(doc(visitorDb(), 'events/e/secretSanta/draw')));
  });

  it('lets the owner draw only from the draw day chosen for the event', async () => {
    const draw = { drawnAt: 'now', participantIds: ['p1'], links: [] };
    const path = 'events/e/secretSanta/draw';
    const setDrawDate = (drawDate: string) =>
      testEnvironment.withSecurityRulesDisabled(async (context) => {
        await updateDoc(doc(context.firestore(), 'events/e'), {
          secretSanta: { enabled: true, giftOptions: false, drawDate },
        });
      });
    await setDrawDate('2099-12-20');
    await assertFails(setDoc(doc(accountDb('owner-uid'), path), draw));

    await setDrawDate('2020-12-20');
    await assertSucceeds(setDoc(doc(accountDb('owner-uid'), path), draw));

    // Already drawn, day moved ahead: a new link for one person still works, a new draw does not.
    await setDrawDate('2099-12-20');
    await assertSucceeds(
      updateDoc(doc(accountDb('owner-uid'), path), { links: [{ participantId: 'p1' }] }),
    );
    await assertFails(updateDoc(doc(accountDb('owner-uid'), path), { drawnAt: 'later' }));
  });

  it('opens a secret link to anyone, signed in or not, but never lists the links', async () => {
    await assertSucceeds(getDoc(doc(visitorDb(), 'secretSantaReveals/tok-1')));
    await assertSucceeds(getDoc(doc(accountDb('stranger-uid'), 'secretSantaReveals/tok-1')));
    await assertFails(getDocs(collection(visitorDb(), 'secretSantaReveals')));
    await assertFails(getDocs(collection(accountDb('owner-uid'), 'secretSantaReveals')));
  });

  it('lets only the owner draw (create and delete links) in one batch', async () => {
    const owner = accountDb('owner-uid');
    const batch = writeBatch(owner);
    batch.delete(doc(owner, 'secretSantaReveals/tok-1'));
    batch.set(doc(owner, 'secretSantaReveals/tok-2'), reveal);
    batch.set(doc(owner, 'events/e/secretSanta/draw'), {
      drawnAt: 'now',
      participantIds: [],
      links: [],
    });
    await assertSucceeds(batch.commit());

    const collab = accountDb('collab-uid');
    await assertFails(setDoc(doc(collab, 'secretSantaReveals/tok-3'), reveal));
    await assertFails(deleteDoc(doc(collab, 'secretSantaReveals/tok-2')));
    await assertFails(setDoc(doc(visitorDb(), 'secretSantaReveals/tok-4'), reveal));
  });

  it('refuses links that change, carry markup or point to an event the account does not own', async () => {
    const owner = accountDb('owner-uid');
    await assertFails(updateDoc(doc(owner, 'secretSantaReveals/tok-1'), { receiverName: 'Ana' }));
    await assertFails(
      setDoc(doc(owner, 'secretSantaReveals/tok-5'), { ...reveal, receiverName: '<script>' }),
    );
    await assertFails(
      setDoc(doc(owner, 'secretSantaReveals/tok-6'), { ...reveal, eventId: 'other-event' }),
    );
    await assertFails(
      setDoc(doc(owner, 'secretSantaReveals/tok-7'), { ...reveal, openedAt: 'already' }),
    );
  });

  const opened = {
    openedAt: '2026-11-16T21:00:00.000Z',
    receiverName: '',
    receiverGiftOptions: [],
  };

  it('lets whoever holds the link open it once, without signing in, erasing whom they drew', async () => {
    await assertSucceeds(updateDoc(doc(visitorDb(), 'secretSantaReveals/tok-1'), opened));
    // Second time: the link is spent.
    await assertFails(
      updateDoc(doc(visitorDb(), 'secretSantaReveals/tok-1'), {
        ...opened,
        openedAt: '2026-11-17T21:00:00.000Z',
      }),
    );
    await assertFails(
      updateDoc(doc(accountDb('owner-uid'), 'secretSantaReveals/tok-1'), { openedAt: null }),
    );
  });

  it('refuses an opening that keeps the name, changes other fields or has no date', async () => {
    const link = doc(visitorDb(), 'secretSantaReveals/tok-1');
    await assertFails(updateDoc(link, { ...opened, receiverName: 'Luiz' }));
    await assertFails(updateDoc(link, { ...opened, receiverGiftOptions: ['Livro'] }));
    await assertFails(updateDoc(link, { ...opened, giverName: 'Outra pessoa' }));
    await assertFails(updateDoc(link, { receiverName: '', receiverGiftOptions: [] }));
  });
});
