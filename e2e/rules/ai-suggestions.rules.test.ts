import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'organizaai-ai-suggestions-rules';
let testEnvironment: RulesTestEnvironment;

const KEY = 'churrasco_20p_vazio';
const CACHE = {
  items: [{ name: 'Picanha', quantity: 6, unit: 'kg', reason: 'carne principal' }],
  tip: 'Compre o gelo no dia.',
  category: 'Churrasco',
  people: 20,
  provider: 'gemini:flash-lite',
};

function accountDb(uid: string) {
  return testEnvironment
    .authenticatedContext(uid, {
      email: `${uid}@test.com`,
      firebase: { sign_in_provider: 'password' },
    })
    .firestore();
}

/** What the AI relay commits with the organizer's token after a good answer. */
function spend(db: Firestore, uid: string, usage: Record<string, unknown>, key = KEY) {
  const batch = writeBatch(db);
  batch.set(doc(db, `ai_usage/${uid}`), { ...usage, lastAt: serverTimestamp() });
  batch.update(doc(db, 'events/e'), { aiSuggestionsUsed: increment(1), aiSuggestionKey: key });
  batch.set(doc(db, `ai_cache/${key}`), { ...CACHE, createdAt: serverTimestamp() });
  return batch.commit();
}

const firstOfHour = { count: 1, windowStart: serverTimestamp() };

async function seed(path: string, data: Record<string, unknown>) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
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
  await seed('events/e', { title: 'Churrasco', createdBy: 'owner', collaborators: ['collab'] });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('spending a suggestion', () => {
  it('lets the owner and a collaborator spend one, with the hour count and the cache', async () => {
    await assertSucceeds(spend(accountDb('owner'), 'owner', firstOfHour));
    await assertSucceeds(spend(accountDb('collab'), 'collab', firstOfHour, 'natal_10p_vazio'));
  });

  it('refuses a guest who does not organise the event', async () => {
    await assertFails(spend(accountDb('guest'), 'guest', firstOfHour));
  });

  it('refuses a 4th suggestion for the event', async () => {
    await seed('events/e', { title: 'Churrasco', createdBy: 'owner', aiSuggestionsUsed: 3 });
    await assertFails(spend(accountDb('owner'), 'owner', firstOfHour));
  });

  it('refuses the event count alone, without the hour count and the cache', async () => {
    await assertFails(updateDoc(doc(accountDb('owner'), 'events/e'), { aiSuggestionsUsed: 1 }));
  });

  it('never lets the owner set the counter back in an ordinary edit', async () => {
    await seed('events/e', { title: 'Churrasco', createdBy: 'owner', aiSuggestionsUsed: 3 });
    await assertFails(updateDoc(doc(accountDb('owner'), 'events/e'), { aiSuggestionsUsed: 0 }));
    await assertSucceeds(updateDoc(doc(accountDb('owner'), 'events/e'), { title: 'Churras' }));
  });
});

describe('ai_usage: 5 per hour', () => {
  const start = Timestamp.fromMillis(Date.now() - 10 * 60 * 1000);

  it('counts up within the hour, up to 5', async () => {
    await seed('ai_usage/owner', { count: 4, windowStart: start, lastAt: start });
    await assertSucceeds(spend(accountDb('owner'), 'owner', { count: 5, windowStart: start }));
  });

  it('refuses a 6th within the hour, and skipping or lowering the count', async () => {
    await seed('ai_usage/owner', { count: 5, windowStart: start, lastAt: start });
    await assertFails(spend(accountDb('owner'), 'owner', { count: 6, windowStart: start }));
    await assertFails(spend(accountDb('owner'), 'owner', firstOfHour));
  });

  it('starts a new hour once the last one has passed', async () => {
    const old = Timestamp.fromMillis(Date.now() - 61 * 60 * 1000);
    await seed('ai_usage/owner', { count: 5, windowStart: old, lastAt: old });
    await assertSucceeds(spend(accountDb('owner'), 'owner', firstOfHour));
  });

  it('is read only by its own person', async () => {
    await seed('ai_usage/owner', { count: 1, windowStart: start, lastAt: start });
    await assertSucceeds(getDoc(doc(accountDb('owner'), 'ai_usage/owner')));
    await assertFails(getDoc(doc(accountDb('collab'), 'ai_usage/owner')));
  });
});

describe('ai_cache', () => {
  it('is read by any account, and never written outside a spent suggestion', async () => {
    await seed(`ai_cache/${KEY}`, { ...CACHE, createdAt: Timestamp.now() });
    await assertSucceeds(getDoc(doc(accountDb('guest'), `ai_cache/${KEY}`)));
    await assertFails(
      setDoc(doc(accountDb('guest'), 'ai_cache/other'), { ...CACHE, createdAt: serverTimestamp() }),
    );
    await assertFails(updateDoc(doc(accountDb('owner'), `ai_cache/${KEY}`), { tip: 'outra' }));
  });

  it('lets an organizer show a cached suggestion on the event, but not a missing one', async () => {
    await seed(`ai_cache/${KEY}`, { ...CACHE, createdAt: Timestamp.now() });
    const db = accountDb('collab');
    await assertSucceeds(updateDoc(doc(db, 'events/e'), { aiSuggestionKey: KEY }));
    await assertFails(updateDoc(doc(db, 'events/e'), { aiSuggestionKey: 'nada_5p_vazio' }));
    await assertFails(updateDoc(doc(accountDb('guest'), 'events/e'), { aiSuggestionKey: KEY }));
  });
});

describe('expectedGuests', () => {
  it('takes empty or 1 to 999', async () => {
    const db = accountDb('owner');
    await assertSucceeds(updateDoc(doc(db, 'events/e'), { expectedGuests: 30 }));
    await assertSucceeds(updateDoc(doc(db, 'events/e'), { expectedGuests: null }));
    await assertFails(updateDoc(doc(db, 'events/e'), { expectedGuests: 0 }));
    await assertFails(updateDoc(doc(db, 'events/e'), { expectedGuests: 1000 }));
  });
});
