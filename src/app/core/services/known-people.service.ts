import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EventService } from './event.service';
import { GuestService } from './guest.service';
import { SecretSantaService } from './secret-santa.service';
import { FamilyService } from './family.service';
import { buildKnownPeople, type KnownPerson } from '../utils/known-people.utils';
import { isPet } from '../utils/relationship.utils';

/** How many of the organizer's other events are read: the most recent ones. */
const EVENTS_READ = 20;

/**
 * The people an organizer already knows: their family and, from the events they own or help
 * organize, the guests, companions and amigo oculto participants. Events they were only
 * invited to stay out: their guest lists belong to someone else.
 */
@Injectable({ providedIn: 'root' })
export class KnownPeopleService {
  private readonly events = inject(EventService);
  private readonly guests = inject(GuestService);
  private readonly secretSanta = inject(SecretSantaService);
  private readonly family = inject(FamilyService);

  async list(uid: string, exceptEventId?: string | null): Promise<KnownPerson[]> {
    if (!uid) return [];
    const events = (await firstValueFrom(this.events.getUserEvents(uid)).catch(() => []))
      .filter((event) => event.id !== exceptEventId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, EVENTS_READ);

    const fromEvents = await Promise.all(
      events.map(async (event) => {
        const [guests, participants] = await Promise.all([
          firstValueFrom(this.guests.listGuests(event.id)).catch(() => []),
          firstValueFrom(this.secretSanta.listParticipants(event.id)).catch(() => []),
        ]);
        return [
          ...guests.flatMap((guest) => [
            { name: guest.name ?? '', phone: guest.phone ?? '' },
            ...(guest.companions ?? []).map((companion) => ({ name: companion.name, phone: '' })),
          ]),
          ...participants.map((p) => ({ name: p.name, phone: p.phone ?? '' })),
        ];
      }),
    );
    // Pets never enter an amigo oculto.
    const family = (await this.family.getFamilyMembers(uid).catch(() => []))
      .filter((member) => !isPet(member.relationship))
      .map((member) => ({ name: member.name, phone: member.phone ?? '' }));
    return buildKnownPeople([...family, ...fromEvents.flat()]);
  }
}
