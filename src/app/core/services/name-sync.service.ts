import { Injectable, inject } from '@angular/core';
import type { FamilyRelationship, ItemClaimEntry } from '../models';
import { secretSantaRsvpId } from '../utils/secret-santa.utils';
import { FirestoreGateway } from './firestore.gateway';
import { SecretSantaService } from './secret-santa.service';

/**
 * A relative renamed on the profile reaches every event the household answered (`rsvpEvents`):
 * their answer, what they bring and their amigo oculto entry while the draw is still open. A
 * relative has no account to look up, so their new name only reaches the events this way.
 * An account holder is never rewritten here: every screen reads them by uid from their profile.
 * (This whole service goes with the cleanup, plan item 6.)
 *
 * Best effort and quiet: an event that is closed or gone keeps its old copy.
 */
@Injectable({ providedIn: 'root' })
export class NameSyncService {
  private readonly gateway = inject(FirestoreGateway);
  private readonly secretSanta = inject(SecretSantaService);

  /** A relative on the profile was renamed. */
  async syncFamilyMemberName(
    uid: string,
    memberId: string,
    name: string,
    /** The kinship shown beside the name in "Confirmados", kept in step too. */
    relationship?: FamilyRelationship,
  ): Promise<void> {
    const clean = name.trim();
    if (!uid || !memberId || !clean) return;
    await this.eachEvent(uid, (eventId) =>
      Promise.all([
        this.renameGuest(`events/${eventId}/guests/${uid}_${memberId}`, clean, relationship),
        this.renameClaims(eventId, uid, memberId, clean),
        this.renameSantaEntry(eventId, uid, secretSantaRsvpId(uid, { familyId: memberId }), clean),
      ]),
    );
  }

  private async eachEvent(uid: string, fn: (eventId: string) => Promise<unknown>): Promise<void> {
    const profile = await this.gateway
      .getDoc<{ rsvpEvents?: string[] }>(`users/${uid}`)
      .catch(() => null);
    const events = [...new Set(profile?.rsvpEvents ?? [])];
    await Promise.all(events.map((eventId) => fn(eventId).catch(() => undefined)));
  }

  private async renameGuest(
    path: string,
    name: string,
    relationship?: FamilyRelationship,
  ): Promise<void> {
    const guest = await this.gateway
      .getDoc<{ name?: string; relationship?: string }>(path)
      .catch(() => null);
    if (!guest) return;
    const changes = {
      ...(guest.name !== name ? { name } : {}),
      ...(relationship && guest.relationship !== relationship
        ? { relationship, ...(relationship === 'pet' ? { phone: '' } : {}) }
        : {}),
    };
    if (!Object.keys(changes).length) return;
    await this.gateway.updateDoc(path, changes).catch(() => undefined);
  }

  /** The lines of what this person brings (`memberId` null for the account holder). */
  private async renameClaims(
    eventId: string,
    uid: string,
    memberId: string | null,
    name: string,
  ): Promise<void> {
    const path = `events/${eventId}/claims/${uid}`;
    const claims = await this.gateway
      .getDoc<{ name?: string; entries?: ItemClaimEntry[] }>(path)
      .catch(() => null);
    if (!claims) return;
    const entries = claims.entries ?? [];
    const renamed = entries.map((entry) =>
      entry.memberId === memberId && entry.who !== name ? { ...entry, who: name } : entry,
    );
    const holderRenamed = memberId === null && claims.name !== name;
    if (!holderRenamed && renamed.every((entry, i) => entry === entries[i])) return;
    await this.gateway
      .updateDoc(path, {
        ...(memberId === null ? { name } : {}),
        entries: renamed,
        updatedAt: new Date().toISOString(),
      })
      .catch(() => undefined);
  }

  /** Their amigo oculto entry, while the draw still lets them change it. */
  private async renameSantaEntry(
    eventId: string,
    uid: string,
    id: string,
    name: string,
  ): Promise<void> {
    const [entry] = await this.secretSanta.getOwnEntries(eventId, [id]).catch(() => []);
    if (!entry || entry.name === name) return;
    await this.secretSanta
      .saveOwnEntries(
        eventId,
        uid,
        [
          {
            id,
            input: {
              name,
              phone: entry.phone,
              giftOptions: entry.giftOptions,
              ...(entry.guestId ? { guestId: entry.guestId } : {}),
            },
          },
        ],
        [],
        [id],
      )
      .catch(() => undefined);
  }
}
