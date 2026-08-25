import { Page } from '@playwright/test';

export interface MockUserSessionOptions {
  uid?: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  isSuperAdmin?: boolean;
  events?: any[];
  userProfile?: any;
  familyMembers?: any[];
}

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

export async function setupMockAuthSession(page: Page, options: MockUserSessionOptions = {}) {
  const uid = options.uid || 'test-user-uid';
  const email = options.email || 'luiz.gmr.dev@gmail.com';
  const displayName = options.displayName || 'Luiz Admin';
  const emailVerified = options.emailVerified !== undefined ? options.emailVerified : true;
  const apiKey = TEST_FIREBASE_API_KEY;

  // The application loads its Firebase key from runtime-config.js. Keep the
  // browser-only Auth instance and the IndexedDB record on the same test key
  // instead of coupling E2E tests to a developer's runtime configuration.
  await mockFirebaseRuntimeConfig(page);

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

  await page.addInitScript(
    ({ uid, email, displayName, emailVerified, apiKey, events, userProfile, familyMembers }) => {
      const mockDocs: Record<string, any> = {
        events: events || [],
        users: userProfile ? [userProfile] : [{ id: uid, email, displayName, phone: '(11) 99999-9999' }],
        family: familyMembers || [],
        [`users/${uid}`]: userProfile || { id: uid, email, displayName, phone: '(11) 99999-9999' },
        [`users/${uid}/family`]: familyMembers || [],
      };

      if (events && Array.isArray(events)) {
        events.forEach((ev: any) => {
          if (ev.id && ev.items && Array.isArray(ev.items)) {
            mockDocs[`events/${ev.id}/items`] = [...ev.items];
          }
        });
      }

      (window as any).__MOCK_DOCUMENTS__ = mockDocs;

      const userValue = {
        uid,
        email,
        emailVerified,
        displayName,
        isAnonymous: false,
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
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
          db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
        }
      };
      req.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('firebaseLocalStorage', 'readwrite');
        const store = tx.objectStore('firebaseLocalStorage');
        store.put({
          fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`,
          value: userValue,
        });
      };
    },
    {
      uid,
      email,
      displayName,
      emailVerified,
      apiKey,
      events: options.events || [],
      userProfile: options.userProfile,
      familyMembers: options.familyMembers || [],
    }
  );
}
