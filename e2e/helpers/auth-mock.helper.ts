import { Page } from '@playwright/test';

/** A Firestore document as the app's mock gateway reads it from `window.__MOCK_DOCUMENTS__`. */
export type MockDocument = { id: string } & Record<string, unknown>;

/** An event plus its sub-collections, flattened into `events/{id}/items|guests` by the helper. */
export type MockEvent = MockDocument & {
  items?: MockDocument[];
  guests?: MockDocument[];
};

export interface MockDocumentsOptions {
  events?: MockEvent[];
  userProfile?: MockDocument;
  familyMembers?: MockDocument[];
}

export interface MockUserSessionOptions extends MockDocumentsOptions {
  uid?: string;
  email?: string;
  displayName?: string;
  isAnonymous?: boolean;
  emailVerified?: boolean;
  isSuperAdmin?: boolean;
}

type MockDocumentStore = Record<string, MockDocument[] | MockDocument>;

const TEST_FIREBASE_API_KEY = 'test-firebase-api-key';

/**
 * Makes the Firebase app boot with the same key used by the browser's mocked
 * IndexedDB session. Keeping this in one helper avoids protected-route tests
 * silently depending on a developer-specific runtime configuration.
 */
export async function mockFirebaseRuntimeConfig(page: Page): Promise<void> {
  await page.route('**/runtime-config.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `globalThis.__organizaAiRuntimeConfig = { firebase: { apiKey: '${TEST_FIREBASE_API_KEY}' } };`,
    });
  });
}

function buildMockDocumentStore(
  uid: string,
  defaultProfile: MockDocument,
  options: MockDocumentsOptions,
): MockDocumentStore {
  const events = options.events ?? [];
  const profile = options.userProfile ?? defaultProfile;
  const store: MockDocumentStore = {
    events: events.map(({ items: _items, guests: _guests, ...event }) => event),
    users: [profile],
    family: options.familyMembers ?? [],
    [`users/${uid}`]: profile,
    [`users/${uid}/family`]: options.familyMembers ?? [],
  };

  for (const event of events) {
    store[`events/${event.id}/items`] = [...(event.items ?? [])];
    store[`events/${event.id}/guests`] = [...(event.guests ?? [])];
  }

  return store;
}

/**
 * Serves every Firestore read from in-memory documents, so a test never reaches
 * the real project. Use it for anonymous visits; `setupMockAuthSession` calls it too.
 */
export async function mockFirestoreDocuments(
  page: Page,
  options: MockDocumentsOptions = {},
  uid = 'anonymous-visitor',
): Promise<void> {
  await mockFirebaseRuntimeConfig(page);
  const store = buildMockDocumentStore(uid, { id: uid }, options);
  await page.addInitScript((documents) => {
    Object.assign(window, { __MOCK_DOCUMENTS__: documents });
  }, store);
}

/** Reads the Firebase user persisted in IndexedDB for this page's browser context. */
export async function readStoredAuthUser(page: Page): Promise<{ email?: string } | null> {
  return page.evaluate(
    () =>
      new Promise<{ email?: string } | null>((resolve) => {
        const req = indexedDB.open('firebaseLocalStorageDb', 1);
        req.onsuccess = () => {
          const getAll = req.result
            .transaction('firebaseLocalStorage', 'readonly')
            .objectStore('firebaseLocalStorage')
            .getAll();
          getAll.onsuccess = () => resolve(getAll.result?.[0]?.value ?? null);
          getAll.onerror = () => resolve(null);
        };
        req.onerror = () => resolve(null);
      }),
  );
}

export async function setupMockAuthSession(page: Page, options: MockUserSessionOptions = {}) {
  const uid = options.uid || 'test-user-uid';
  const email = options.email || 'luiz.gmr.dev@gmail.com';
  const displayName = options.displayName || 'Luiz Admin';
  const emailVerified = options.emailVerified !== undefined ? options.emailVerified : true;
  const isAnonymous = options.isAnonymous ?? false;
  const apiKey = TEST_FIREBASE_API_KEY;

  await page.route('https://securetoken.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token',
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: 'mock-refresh-token',
        id_token: 'mock-id-token',
        user_id: uid,
        project_id: 'organiza-ai-3416f',
      }),
    });
  });

  await page.route('https://identitytoolkit.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [
          {
            localId: uid,
            email,
            emailVerified,
            displayName,
          },
        ],
      }),
    });
  });

  await mockFirestoreDocuments(
    page,
    {
      ...options,
      userProfile: options.userProfile ?? {
        id: uid,
        email,
        displayName,
        phone: '(11) 99999-9999',
      },
    },
    uid,
  );

  await page.addInitScript(
    ({ uid, email, displayName, emailVerified, isAnonymous, apiKey }) => {
      const userValue = {
        uid,
        email,
        emailVerified,
        displayName,
        isAnonymous,
        photoURL: null,
        apiKey,
        appName: '[DEFAULT]',
        authDomain: 'organiza-ai-3416f.firebaseapp.com',
        stsTokenManager: {
          apiKey,
          refreshToken: 'mock-refresh-token',
          accessToken: 'mock-access-token',
          expirationTime: Date.now() + 36000000,
        },
        createdAt: '1700000000000',
        lastLoginAt: '1700000000000',
      };

      const req = indexedDB.open('firebaseLocalStorageDb', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
          db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
        }
      };
      req.onsuccess = () => {
        const tx = req.result.transaction('firebaseLocalStorage', 'readwrite');
        tx.objectStore('firebaseLocalStorage').put({
          fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`,
          value: userValue,
        });
      };
    },
    { uid, email, displayName, emailVerified, isAnonymous, apiKey },
  );
}
