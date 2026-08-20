import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { vi } from 'vitest';
import type { PartyEvent, PartyEventCreate, PartyEventUpdate } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MockEventService {
  readonly listEvents = vi.fn((): Observable<PartyEvent[]> => of([]));
  readonly getEvent = vi.fn((_eventId: string): Observable<PartyEvent | null> => of(null));
  readonly createEvent = vi.fn((_data: PartyEventCreate): Promise<string> => Promise.resolve('mock-event-id'));
  readonly updateEvent = vi.fn((_eventId: string, _data: PartyEventUpdate): Promise<void> => Promise.resolve());
  readonly saveEvent = vi.fn((_eventId: string, _data: PartyEventUpdate): Promise<void> => Promise.resolve());
  readonly cancelEvent = vi.fn((_eventId: string): Promise<void> => Promise.resolve());
  readonly deleteEvent = vi.fn((_eventId: string): Promise<void> => Promise.resolve());
}
