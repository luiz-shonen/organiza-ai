import type { MockEvent } from '../helpers/auth-mock.helper';

/** Deterministic data for guest-facing tests; nothing here touches the real Firestore. */
export const GUEST_UID = 'e2e-guest-uid';

const inDays = (days: number): string => new Date(Date.now() + 86400000 * days).toISOString();

/** A public event with Pix, a budget, two confirmed guests and one free + one claimed item. */
export function buildGuestEvent(overrides: Partial<MockEvent> = {}): MockEvent {
  return {
    id: 'e2e-guest-event',
    title: 'Festa Junina da Família',
    category: 'Festa Junina',
    description: 'Comidas típicas, quadrilha e fogueira.',
    date: inDays(7),
    location: 'Rua das Bandeirinhas, 100 - Centro - São Paulo/SP - CEP: 01001-000',
    pixKey: 'festa.familia@pix.com',
    pixType: 'E-mail',
    estimatedBudget: 600,
    status: 'active',
    createdBy: 'e2e-organizer-uid',
    collaborators: [],
    createdAt: inDays(-10),
    updatedAt: inDays(-10),
    guests: [
      {
        id: 'guest-1',
        name: 'Ana',
        phone: '11911111111',
        isConfirmed: true,
        confirmedAt: inDays(-2),
      },
      {
        id: 'guest-2',
        name: 'Bruno',
        phone: '11922222222',
        isConfirmed: true,
        confirmedAt: inDays(-1),
      },
    ],
    items: [
      { id: 'item-free', name: 'Pamonha', quantity: 2, claimedBy: null },
      {
        id: 'item-mine',
        name: 'Quentão',
        quantity: 1,
        claimedBy: { uid: GUEST_UID, name: 'Convidada E2E', phone: '11933333333' },
      },
    ],
    ...overrides,
  };
}
