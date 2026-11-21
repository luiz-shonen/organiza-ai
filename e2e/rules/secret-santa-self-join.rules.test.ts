import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

/** Guests joining the amigo oculto from the invite ("Vai participar do amigo oculto?"). */
const projectId = 'organizaai-secret-santa-self-join-rules';
let testEnvironment: RulesTestEnvironment;

const entry = (uid: string, extra: Record<string, unknown> = {}) => ({
  name: 'Maria',
  phone: '(11) 98888-1111',
  giftOptions: ['Livro'],
  guestId: uid,
  joinedBy: uid,
  createdAt: '2026-11-17T10:00:00.000Z',
  ...extra,
});

function accountDb(uid: string) {
  return testEnvironment
    .authenticatedContext(uid, {
      email: `${uid}@test.com`,
      firebase: { sign_in_provider: 'google.com' },
    })
    .firestore();
}

async function setSettings(secretSanta: Record<string, unknown>) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), 'events/e'), { secretSanta });
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
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'events/e'), {
      title: 'Natal 2026',
      createdBy: 'owner-uid',
      collaborators: [],
      secretSanta: { enabled: true, giftOptions: true, maxGiftOptions: 3 },
    });
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('amigo oculto sign-ups from the invite', () => {
  const path = (id: string) => `events/e/secretSantaParticipants/${id}`;

  it('lets a guest put themself, a relative and a companion in, under their own ids', async () => {
    const maria = accountDb('maria');
    await assertSucceeds(setDoc(doc(maria, path('rsvp_maria')), entry('maria')));
    await assertSucceeds(
      setDoc(
        doc(maria, path('rsvp_maria_f_ana')),
        entry('maria', { name: 'Dona Ana', guestId: 'maria_ana' }),
      ),
    );
    await assertSucceeds(
      setDoc(doc(maria, path('rsvp_maria_c_bia')), entry('maria', { name: 'Bia' })),
    );
  });

  it('reads and removes only their own entries, and never the list', async () => {
    const maria = accountDb('maria');
    await assertSucceeds(setDoc(doc(maria, path('rsvp_maria')), entry('maria')));
    await assertSucceeds(getDoc(doc(maria, path('rsvp_maria'))));
    // Not there yet: the guest may still check.
    await assertSucceeds(getDoc(doc(maria, path('rsvp_maria_f_ana'))));
    await assertFails(getDoc(doc(accountDb('joao'), path('rsvp_maria'))));
    await assertFails(getDocs(collection(maria, 'events/e/secretSantaParticipants')));
    await assertFails(deleteDoc(doc(accountDb('joao'), path('rsvp_maria'))));
    await assertSucceeds(deleteDoc(doc(maria, path('rsvp_maria'))));
  });

  it('refuses an entry under another id or another account', async () => {
    const maria = accountDb('maria');
    await assertFails(setDoc(doc(maria, path('rsvp_joao')), entry('maria')));
    await assertFails(setDoc(doc(maria, path('p1')), entry('maria')));
    await assertFails(setDoc(doc(maria, path('rsvp_maria')), entry('joao')));
    await assertFails(setDoc(doc(maria, path('rsvp_mariana')), entry('mariana')));
    await assertFails(
      setDoc(doc(maria, path('rsvp_maria')), entry('maria', { distinctFrom: ['p1'] })),
    );
  });

  it('does not let a guest take over an entry the organizer typed', async () => {
    await assertSucceeds(
      setDoc(doc(accountDb('owner-uid'), path('rsvp_maria')), {
        name: 'Maria',
        phone: '',
        giftOptions: [],
      }),
    );
    await assertFails(updateDoc(doc(accountDb('maria'), path('rsvp_maria')), { phone: '' }));
  });

  it('closing the sign-ups stops joining and changes, not leaving; no amigo oculto closes all', async () => {
    const maria = accountDb('maria');
    await assertSucceeds(setDoc(doc(maria, path('rsvp_maria')), entry('maria')));
    await setSettings({ enabled: true, giftOptions: true, selfJoin: false });
    await assertFails(updateDoc(doc(maria, path('rsvp_maria')), { giftOptions: [] }));
    await assertFails(setDoc(doc(maria, path('rsvp_maria_c_bia')), entry('maria')));
    await assertSucceeds(deleteDoc(doc(maria, path('rsvp_maria'))));
    await setSettings({ enabled: false, giftOptions: false });
    await assertFails(setDoc(doc(maria, path('rsvp_maria_c_bia')), entry('maria')));
  });

  it('lets the owner close the sign-ups, and the organizers merge or tell apart', async () => {
    const owner = accountDb('owner-uid');
    await assertSucceeds(
      updateDoc(doc(owner, 'events/e'), {
        secretSanta: { enabled: true, giftOptions: true, selfJoin: false },
      }),
    );
    await assertFails(
      updateDoc(doc(owner, 'events/e'), {
        secretSanta: { enabled: true, giftOptions: true, selfJoin: 'no' },
      }),
    );
    await setSettings({ enabled: true, giftOptions: true });
    await assertSucceeds(setDoc(doc(accountDb('maria'), path('rsvp_maria')), entry('maria')));
    await assertSucceeds(
      updateDoc(doc(owner, path('rsvp_maria')), { phone: '', distinctFrom: ['p1'] }),
    );
    await assertFails(updateDoc(doc(owner, path('rsvp_maria')), { joinedBy: 'owner-uid' }));
    await assertSucceeds(deleteDoc(doc(owner, path('rsvp_maria'))));
  });
});
