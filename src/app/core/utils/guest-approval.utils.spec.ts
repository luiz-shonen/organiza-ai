import { describe, expect, it } from 'vitest';
import type { Guest } from '../models';
import { splitGuestsByApproval } from './guest-approval.utils';

const guest = (id: string, extra: Partial<Guest> = {}): Guest => ({
  id,
  name: id,
  isConfirmed: true,
  confirmedAt: '2026-11-17T10:00:00.000Z',
  ...extra,
});

describe('splitGuestsByApproval', () => {
  const maria = guest('maria', {
    uid: 'maria',
    phone: '(11) 98888-1111',
    approved: false,
    companionsCount: 1,
    companions: [{ name: 'Bia' }],
  });
  const ana = guest('maria_ana', { primaryGuestId: 'maria' });
  const joao = guest('joao', { uid: 'joao', approved: true });
  const old = guest('old', { uid: 'old' });

  it('counts everyone when the event does not ask for approval', () => {
    expect(splitGuestsByApproval([maria, ana, joao], false)).toEqual({
      approved: [maria, ana, joao],
      pending: [],
    });
  });

  it('keeps a waiting guest and their relatives out, approved and older guests in', () => {
    const { approved, pending } = splitGuestsByApproval([maria, ana, joao, old], true);
    expect(approved.map((g) => g.id)).toEqual(['joao', 'old']);
    expect(pending).toEqual([
      {
        id: 'maria',
        name: 'maria',
        phone: '(11) 98888-1111',
        people: 3,
        familyGuestIds: ['maria_ana'],
      },
    ]);
  });
});
