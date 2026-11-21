import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { KnownPeopleService } from './known-people.service';
import { EventService } from './event.service';
import { GuestService } from './guest.service';
import { SecretSantaService } from './secret-santa.service';
import { FamilyService } from './family.service';

describe('KnownPeopleService', () => {
  const events = { getUserEvents: vi.fn() };
  const guests = { listGuests: vi.fn() };
  const santa = { listParticipants: vi.fn() };
  const family = { getFamilyMembers: vi.fn() };
  let service: KnownPeopleService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: EventService, useValue: events },
        { provide: GuestService, useValue: guests },
        { provide: SecretSantaService, useValue: santa },
        { provide: FamilyService, useValue: family },
      ],
    });
    service = TestBed.inject(KnownPeopleService);
  });

  it('gathers family, guests, companions and participants of my other events, once each', async () => {
    events.getUserEvents.mockReturnValue(
      of([
        { id: 'now', date: '2026-12-24' },
        { id: 'past', date: '2025-12-24' },
      ]),
    );
    guests.listGuests.mockImplementation((id: string) =>
      of(
        id === 'past'
          ? [{ name: 'Gustavo', phone: '(31) 99999-0000', companions: [{ name: 'Bia' }] }]
          : [{ name: 'Not offered', phone: '' }],
      ),
    );
    santa.listParticipants.mockImplementation((id: string) =>
      id === 'past' ? of([{ name: 'gustavo', phone: '(31) 99999-0000' }]) : throwError(() => 1),
    );
    family.getFamilyMembers.mockResolvedValue([{ name: 'Vó Ana', phone: '' }]);

    const people = await service.list('u1', 'now');

    expect(guests.listGuests).not.toHaveBeenCalledWith('now');
    expect(people).toEqual([
      { name: 'Bia', phone: '' },
      { name: 'Gustavo', phone: '(31) 99999-0000' },
      { name: 'Vó Ana', phone: '' },
    ]);
  });

  it('knows nobody without an account', async () => {
    expect(await service.list('')).toEqual([]);
    expect(events.getUserEvents).not.toHaveBeenCalled();
  });
});
