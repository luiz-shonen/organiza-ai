import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EventService } from './event.service';
import { GuestService } from './guest.service';
import { SecretSantaService } from './secret-santa.service';
import { buildKnownPeople, type KnownPerson } from '../utils/known-people.utils';

/** How many of the organizer's events are read: the most recent ones. */
const EVENTS_READ = 20;

/**
 * The people an organizer typed by hand before, offered in "Adicionar alguém à mão" of the
 * amigo oculto: from the events they own or help organize (the current one included), amigo
 * oculto participants and "Confirmados" guests (with their companions) added by an organizer.
 * Whoever has an account (joined from the invite, or answered it) is never offered: they join
 * by themselves. Events they were only invited to stay out: those lists belong to someone else.
 */
@Injectable({ providedIn: 'root' })
export class KnownPeopleService {
  private readonly events = inject(EventService);
  private readonly guests = inject(GuestService);
  private readonly secretSanta = inject(SecretSantaService);

  async list(uid: string): Promise<KnownPerson[]> {
    if (!uid) return [];
    const events = (await firstValueFrom(this.events.getUserEvents(uid)).catch(() => []))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, EVENTS_READ);

    const fromEvents = await Promise.all(
      events.map(async (event) => {
        const [guests, participants] = await Promise.all([
          firstValueFrom(this.guests.listGuests(event.id)).catch(() => []),
          firstValueFrom(this.secretSanta.listParticipants(event.id)).catch(() => []),
        ]);
        return [
          ...guests
            .filter((guest) => !!guest.addedBy && !guest.uid)
            .flatMap((guest) => [
              { name: guest.name ?? '', phone: guest.phone ?? '' },
              ...(guest.companions ?? []).map((companion) => ({ name: companion.name, phone: '' })),
            ]),
          ...participants
            .filter((p) => !p.joinedBy && !p.guestId)
            .map((p) => ({ name: p.name, phone: p.phone ?? '' })),
        ];
      }),
    );
    return buildKnownPeople(fromEvents.flat());
  }
}
