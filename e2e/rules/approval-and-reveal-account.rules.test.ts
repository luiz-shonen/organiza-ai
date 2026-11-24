import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

/**
 * "Aprovar quem confirma pelo link" and amigo oculto links that open only in their account.
 */
const projectId = 'organizaai-approval-rules';
let testEnvironment: RulesTestEnvironment;

function accountDb(uid: string) {
  return testEnvironment
    .authenticatedContext(uid, {
      email: `${uid}@test.com`,
      firebase: { sign_in_provider: 'google.com' },
    })
    .firestore();
}

function visitorDb() {
  return testEnvironment.unauthenticatedContext().firestore();
}

const rsvp = (uid: string, extra: Record<string, unknown> = {}) => ({
  uid,
  name: 'Maria',
  phone: '(11) 98888-1111',
  companionsCount: 0,
  isConfirmed: true,
  confirmedAt: '2026-11-17T10:00:00.000Z',
  ...extra,
});

const reveal = (extra: Record<string, unknown> = {}) => ({
  eventId: 'e',
  eventTitle: 'Natal 2026',
  eventDate: '2026-12-24T20:00:00.000Z',
  giverName: 'Maria',
  receiverName: 'Luiz',
  receiverGiftOptions: [],
  createdAt: '2026-11-17T10:00:00.000Z',
  ...extra,
});

async function seed(event: Record<string, unknown>) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'events/e'), {
      title: 'Natal 2026',
      createdBy: 'owner-uid',
      collaborators: [],
      ...event,
    });
  });
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
  await seed({});
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('guest approval', () => {
  it('lets the owner turn approval on, with a yes or no only', async () => {
    const owner = accountDb('owner-uid');
    await assertSucceeds(updateDoc(doc(owner, 'events/e'), { requireApproval: true }));
    await assertFails(updateDoc(doc(owner, 'events/e'), { requireApproval: 'sim' }));
  });

  it('confirms at once without approval', async () => {
    await assertSucceeds(setDoc(doc(accountDb('maria'), 'events/e/guests/maria'), rsvp('maria')));
  });

  it('with approval, a new answer must wait, and the guest cannot approve themself', async () => {
    await seed({ requireApproval: true });
    const maria = accountDb('maria');
    await assertFails(setDoc(doc(maria, 'events/e/guests/maria'), rsvp('maria')));
    await assertFails(
      setDoc(doc(maria, 'events/e/guests/maria'), rsvp('maria', { approved: true })),
    );
    await assertSucceeds(
      setDoc(doc(maria, 'events/e/guests/maria'), rsvp('maria', { approved: false })),
    );
    await assertFails(updateDoc(doc(maria, 'events/e/guests/maria'), { approved: true }));
    // Answering again (another phone) keeps the wait.
    await assertSucceeds(
      updateDoc(doc(maria, 'events/e/guests/maria'), { phone: '(11) 97777-0000' }),
    );
    await assertSucceeds(
      updateDoc(doc(accountDb('owner-uid'), 'events/e/guests/maria'), { approved: true }),
    );
  });

  it('lets a guest who confirmed join the amigo oculto while waiting; who did not, never', async () => {
    await seed({ requireApproval: true, secretSanta: { enabled: true, giftOptions: false } });
    const maria = accountDb('maria');
    const entry = {
      name: 'Maria',
      phone: '',
      giftOptions: [],
      guestId: 'maria',
      joinedBy: 'maria',
    };
    const path = 'events/e/secretSantaParticipants/rsvp_maria';
    // Not confirmed yet: no entry.
    await assertFails(setDoc(doc(maria, path), entry));
    // Confirmed and waiting: joins at once (the app counts it once she is approved).
    await assertSucceeds(
      setDoc(doc(maria, 'events/e/guests/maria'), rsvp('maria', { approved: false })),
    );
    await assertSucceeds(setDoc(doc(maria, path), entry));
    await assertFails(
      setDoc(doc(accountDb('tia'), 'events/e/secretSantaParticipants/rsvp_tia'), {
        ...entry,
        guestId: 'tia',
        joinedBy: 'tia',
      }),
    );
  });
});

describe('amigo oculto link of an account', () => {
  beforeEach(async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'secretSantaReveals/tok-open'), reveal());
      await setDoc(
        doc(context.firestore(), 'secretSantaReveals/tok-maria'),
        reveal({ giverUid: 'maria' }),
      );
    });
  });

  it('opens a link without an account to anyone holding it', async () => {
    await assertSucceeds(getDoc(doc(visitorDb(), 'secretSantaReveals/tok-open')));
  });

  it('opens a link of an account only in it, and to the event owner', async () => {
    await assertFails(getDoc(doc(visitorDb(), 'secretSantaReveals/tok-maria')));
    await assertFails(getDoc(doc(accountDb('primo'), 'secretSantaReveals/tok-maria')));
    await assertSucceeds(getDoc(doc(accountDb('maria'), 'secretSantaReveals/tok-maria')));
    await assertSucceeds(getDoc(doc(accountDb('owner-uid'), 'secretSantaReveals/tok-maria')));
    // A link that does not exist reads as "not found", not as someone else's.
    await assertSucceeds(getDoc(doc(visitorDb(), 'secretSantaReveals/tok-missing')));
  });

  it('lets only that account spend it', async () => {
    const opening = {
      openedAt: '2026-11-17T12:00:00.000Z',
      receiverName: '',
      receiverGiftOptions: [],
    };
    await assertFails(updateDoc(doc(accountDb('primo'), 'secretSantaReveals/tok-maria'), opening));
    await assertSucceeds(
      updateDoc(doc(accountDb('maria'), 'secretSantaReveals/tok-maria'), opening),
    );
  });

  it('lets the owner write a link tied to an account', async () => {
    await assertSucceeds(
      setDoc(
        doc(accountDb('owner-uid'), 'secretSantaReveals/tok-new'),
        reveal({ giverUid: 'joao' }),
      ),
    );
  });
});
