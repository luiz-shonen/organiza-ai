import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { KnownPeopleService } from './known-people.service';
import { EventService } from './event.service';
import { GuestService } from './guest.service';
import { SecretSantaService } from './secret-santa.service';

describe('KnownPeopleService', () => {
  const events = { getUserEvents: vi.fn() };
  const guests = { listGuests: vi.fn() };
  const santa = { listParticipants: vi.fn() };
  let service: KnownPeopleService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: EventService, useValue: events },
        { provide: GuestService, useValue: guests },
        { provide: SecretSantaService, useValue: santa },
      ],
    });
    service = TestBed.inject(KnownPeopleService);
  });

  it('offers only the people added by hand, in this event and the others, once each', async () => {
    events.getUserEvents.mockReturnValue(
      of([
        { id: 'now', date: '2026-12-24' },
        { id: 'past', date: '2025-12-24' },
      ]),
    );
    guests.listGuests.mockImplementation((id: string) =>
      of(
        id === 'past'
          ? [
              // Typed by an organizer in "Confirmados": no account.
              {
                name: 'Gustavo',
                phone: '(31) 99999-0000',
                addedBy: 'u1',
                companions: [{ name: 'Bia' }],
              },
              // Answered the invite with an account: joins by themself.
              { name: 'Jéssica Melo', phone: '(11) 98888-1111', uid: 'g1', companions: [] },
            ]
          : [{ name: 'Tio Zé', phone: '', addedBy: 'u1' }],
      ),
    );
    santa.listParticipants.mockImplementation((id: string) =>
      id === 'past'
        ? of([
            { name: 'gustavo', phone: '(31) 99999-0000' },
            { name: 'Jéssica Melo', phone: '(11) 98888-1111', joinedBy: 'g1' },
            { name: 'Lucas', phone: '', guestId: 'g2' },
            { name: 'Vó Ana', phone: '' },
          ])
        : throwError(() => 1),
    );

    const people = await service.list('u1');

    expect(people).toEqual([
      { name: 'Bia', phone: '' },
      { name: 'Gustavo', phone: '(31) 99999-0000' },
      { name: 'Tio Zé', phone: '' },
      { name: 'Vó Ana', phone: '' },
    ]);
  });

  it('knows nobody without an account', async () => {
    expect(await service.list('')).toEqual([]);
    expect(events.getUserEvents).not.toHaveBeenCalled();
  });
});
