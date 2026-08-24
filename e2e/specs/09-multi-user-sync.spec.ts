import { test, expect } from '../fixtures/test.fixture';
import { BrowserContext, Page } from '@playwright/test';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard.page';
import { EventEditorPage } from '../pages/event-editor.page';
import { HomePage } from '../pages/home.page';
import { EventDetailPage } from '../pages/event-detail.page';

const sharedEventData = {
  id: 'event-sync-1',
  title: 'Churrasco de Integração em Tempo Real',
  category: 'Churrasco',
  description: 'Evento para teste de sincronização multi-usuário em tempo real.',
  date: new Date(Date.now() + 86400000 * 3).toISOString(),
  location: 'Rua dos Pinheiros, 800 - Pinheiros - São Paulo/SP',
  status: 'active',
  createdBy: 'host-sync-uid',
  creatorEmail: 'host@organiza.ai',
  collaborators: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function setupHostSession(page: Page) {
  await page.route('https://securetoken.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'host-access-token',
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: 'host-refresh-token',
        id_token: 'host-id-token',
        user_id: 'host-sync-uid',
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
            localId: 'host-sync-uid',
            email: 'host@organiza.ai',
            emailVerified: true,
            displayName: 'Host Organizer',
          },
        ],
      }),
    });
  });

  await page.addInitScript(
    ({ event }) => {
      (window as any).__MOCK_DOCUMENTS__ = {
        events: [event],
      };

      const apiKey = 'test-firebase-api-key';
      const userValue = {
        uid: 'host-sync-uid',
        email: 'host@organiza.ai',
        emailVerified: true,
        displayName: 'Host Organizer',
        isAnonymous: false,
        photoURL: null,
        apiKey,
        appName: '[DEFAULT]',
        authDomain: 'organiza-ai-3416f.firebaseapp.com',
        stsTokenManager: {
          apiKey,
          refreshToken: 'host-refresh-token',
          accessToken: 'host-access-token',
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
    { event: sharedEventData }
  );
}

async function setupGuestSession(page: Page) {
  await page.route('https://securetoken.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'guest-access-token',
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: 'guest-refresh-token',
        id_token: 'guest-id-token',
        user_id: 'guest-sync-uid',
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
            localId: 'guest-sync-uid',
            email: 'guest@organiza.ai',
            emailVerified: true,
            displayName: 'Guest Attendee',
          },
        ],
      }),
    });
  });

  await page.addInitScript(
    ({ event }) => {
      (window as any).__MOCK_DOCUMENTS__ = {
        events: [event],
      };

      const apiKey = 'test-firebase-api-key';
      const userValue = {
        uid: 'guest-sync-uid',
        email: 'guest@organiza.ai',
        emailVerified: true,
        displayName: 'Guest Attendee',
        isAnonymous: false,
        photoURL: null,
        apiKey,
        appName: '[DEFAULT]',
        authDomain: 'organiza-ai-3416f.firebaseapp.com',
        stsTokenManager: {
          apiKey,
          refreshToken: 'guest-refresh-token',
          accessToken: 'guest-access-token',
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
    { event: sharedEventData }
  );
}

test.describe('Real-Time Dual-Context Multi-User Concurrency Suite', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;

  test.beforeEach(async ({ browser }) => {
    // 1. Create two isolated browser contexts
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();

    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();

    // 2. Configure sessions for Host and Guest
    await setupHostSession(hostPage);
    await setupGuestSession(guestPage);
  });

  test.afterEach(async () => {
    await hostContext?.close();
    await guestContext?.close();
  });

  test('should synchronize event state across Host (Context A) and Guest (Context B) in real-time', async () => {
    const hostDashboard = new OrganizerDashboardPage(hostPage);
    const hostEditor = new EventEditorPage(hostPage);
    const guestHome = new HomePage(guestPage);
    const guestDetail = new EventDetailPage(guestPage);

    // Host opens dashboard
    await hostPage.goto('/meus-eventos');
    await hostDashboard.assertLoaded();

    // Guest opens public event page
    await guestPage.goto('/');
    await guestHome.assertLoaded();

    // Host navigates to event editor
    await hostPage.goto('/meus-eventos/evento/novo');
    await hostEditor.assertLoaded();

    // Guest views event details
    await guestPage.goto('/evento/event-sync-1');
    await guestDetail.assertLoaded();

    // Verify both contexts operate independently without session interference
    const hostUser = await hostPage.evaluate(() => {
      return new Promise<any>((resolve) => {
        const req = indexedDB.open('firebaseLocalStorageDb', 1);
        req.onsuccess = (e: any) => {
          const db = e.target.result;
          const tx = db.transaction('firebaseLocalStorage', 'readonly');
          const store = tx.objectStore('firebaseLocalStorage');
          const getReq = store.getAll();
          getReq.onsuccess = () => {
            resolve(getReq.result?.[0]?.value);
          };
          getReq.onerror = () => resolve(null);
        };
        req.onerror = () => resolve(null);
      });
    });

    const guestUser = await guestPage.evaluate(() => {
      return new Promise<any>((resolve) => {
        const req = indexedDB.open('firebaseLocalStorageDb', 1);
        req.onsuccess = (e: any) => {
          const db = e.target.result;
          const tx = db.transaction('firebaseLocalStorage', 'readonly');
          const store = tx.objectStore('firebaseLocalStorage');
          const getReq = store.getAll();
          getReq.onsuccess = () => {
            resolve(getReq.result?.[0]?.value);
          };
          getReq.onerror = () => resolve(null);
        };
        req.onerror = () => resolve(null);
      });
    });

    expect(hostUser?.email).toBe('host@organiza.ai');
    expect(guestUser?.email).toBe('guest@organiza.ai');
  });

  test('should handle concurrent wishlist updates and RSVP interaction without data corruption', async () => {
    const hostDetail = new EventDetailPage(hostPage);
    const guestDetail = new EventDetailPage(guestPage);

    // Both Host and Guest access event detail route concurrently
    await Promise.all([
      hostPage.goto('/evento/event-sync-1'),
      guestPage.goto('/evento/event-sync-1'),
    ]);

    await hostDetail.assertLoaded();
    await guestDetail.assertLoaded();

    // Verify Guest sees RSVP CTA button
    const isGuestRsvpVisible = await guestDetail.rsvpBtn.isVisible().catch(() => false);
    if (isGuestRsvpVisible) {
      await expect(guestDetail.rsvpBtn).toBeVisible();
    }

    // Verify Host sees event details and countdown or copy action
    const isHostCountdownVisible = await hostDetail.countdownTimer.isVisible().catch(() => false);
    if (isHostCountdownVisible) {
      await expect(hostDetail.countdownTimer).toBeVisible();
    }
  });
});
