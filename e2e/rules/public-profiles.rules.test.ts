import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

/** The organizer's name as guests see it: the name only, written by that account. */
let testEnvironment: RulesTestEnvironment;

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: 'organizaai-public-profiles-rules',
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

describe('public profiles', () => {
  it('anyone reads a name; only its account writes it, and only the name', async () => {
    const luiz = testEnvironment.authenticatedContext('luiz').firestore();
    await assertSucceeds(setDoc(doc(luiz, 'publicProfiles/luiz'), { name: 'Luiz Rodrigues' }));
    await assertFails(setDoc(doc(luiz, 'publicProfiles/ana'), { name: 'Ana' }));
    await assertFails(
      setDoc(doc(luiz, 'publicProfiles/luiz'), { name: 'Luiz', phone: '(11) 90000-0000' }),
    );
    const visitor = testEnvironment.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(visitor, 'publicProfiles/luiz')));
  });
});
