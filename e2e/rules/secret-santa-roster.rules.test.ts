import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDocs, collection, setDoc, writeBatch } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

/** The amigo oculto as guests see it: names and gift options, no phones. */
const projectId = 'organizaai-secret-santa-roster-rules';
let testEnvironment: RulesTestEnvironment;

const roster = (name = 'Maria') => ({
  name,
  giftOptions: ['Livro'],
  createdAt: '2026-11-21T10:00:00.000Z',
});
const participant = (uid: string, name = 'Maria') => ({
  name,
  phone: '(11) 98888-1111',
  giftOptions: ['Livro'],
  guestId: uid,
  joinedBy: uid,
  createdAt: '2026-11-21T10:00:00.000Z',
});

function accountDb(uid: string) {
  return testEnvironment
    .authenticatedContext(uid, {
      email: `${uid}@test.com`,
      firebase: { sign_in_provider: 'google.com' },
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
    const db = context.firestore();
    await setDoc(doc(db, 'events/e'), {
      title: 'Natal 2026',
      createdBy: 'owner-uid',
      collaborators: [],
      secretSanta: { enabled: true, giftOptions: true, maxGiftOptions: 3 },
    });
    await setDoc(doc(db, 'events/e/secretSantaRoster/p1'), roster('Vó Lurdes'));
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('amigo oculto roster', () => {
  const rosterPath = (id: string) => `events/e/secretSantaRoster/${id}`;
  const participantPath = (id: string) => `events/e/secretSantaParticipants/${id}`;

  it('any signed-in guest reads the names and gift options; a visitor does not', async () => {
    await assertSucceeds(getDocs(collection(accountDb('maria'), 'events/e/secretSantaRoster')));
    await assertFails(
      getDocs(
        collection(
          testEnvironment.unauthenticatedContext().firestore(),
          'events/e/secretSantaRoster',
        ),
      ),
    );
  });

  it('the organizer writes any entry, with no phone in it', async () => {
    const owner = accountDb('owner-uid');
    await assertSucceeds(setDoc(doc(owner, rosterPath('p2')), roster('Tio Zé')));
    await assertFails(
      setDoc(doc(owner, rosterPath('p3')), { ...roster('Tio Zé'), phone: '(11) 90000-0000' }),
    );
  });

  it('a guest writes their own entry together with their participant entry', async () => {
    const maria = accountDb('maria');
    const batch = writeBatch(maria);
    batch.set(doc(maria, participantPath('rsvp_maria')), participant('maria'));
    batch.set(doc(maria, rosterPath('rsvp_maria')), roster('Maria'));
    await assertSucceeds(batch.commit());
  });

  it('a guest cannot write a roster entry alone, nor anyone else’s', async () => {
    const maria = accountDb('maria');
    await assertFails(setDoc(doc(maria, rosterPath('rsvp_maria')), roster('Maria')));
    await assertFails(setDoc(doc(maria, rosterPath('p1')), roster('Outra pessoa')));
    await assertFails(setDoc(doc(maria, rosterPath('rsvp_joao')), roster('João')));
  });

  it('a guest leaving takes their roster entry out in the same batch', async () => {
    const maria = accountDb('maria');
    const join = writeBatch(maria);
    join.set(doc(maria, participantPath('rsvp_maria')), participant('maria'));
    join.set(doc(maria, rosterPath('rsvp_maria')), roster('Maria'));
    await assertSucceeds(join.commit());

    const leave = writeBatch(maria);
    leave.delete(doc(maria, participantPath('rsvp_maria')));
    leave.delete(doc(maria, rosterPath('rsvp_maria')));
    await assertSucceeds(leave.commit());
  });
});
