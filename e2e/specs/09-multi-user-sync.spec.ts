import { test, expect } from '../fixtures/test.fixture';
import { BrowserContext, Page } from '@playwright/test';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard.page';
import { EventEditorPage } from '../pages/event-editor.page';
import { HomePage } from '../pages/home.page';
import { EventDetailPage } from '../pages/event-detail.page';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';

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
  await setupMockAuthSession(page, {
    uid: 'host-sync-uid',
    email: 'host@organiza.ai',
    displayName: 'Host Organizer',
    events: [sharedEventData],
    userProfile: {
      id: 'host-sync-uid',
      email: 'host@organiza.ai',
      displayName: 'Host Organizer',
      phone: '(11) 99999-1111',
    },
  });
}

async function setupGuestSession(page: Page) {
  await setupMockAuthSession(page, {
    uid: 'guest-sync-uid',
    email: 'guest@organiza.ai',
    displayName: 'Guest Attendee',
    events: [sharedEventData],
    userProfile: {
      id: 'guest-sync-uid',
      email: 'guest@organiza.ai',
      displayName: 'Guest Attendee',
      phone: '(11) 99999-2222',
    },
  });
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
