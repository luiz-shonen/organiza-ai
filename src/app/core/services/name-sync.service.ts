import { Injectable, inject } from '@angular/core';
import type { ItemClaimEntry } from '../models';
import { secretSantaRsvpId } from '../utils/secret-santa.utils';
import { FirestoreGateway } from './firestore.gateway';
import { SecretSantaService } from './secret-santa.service';

/**
 * A name changed on the profile reaches every event the household answered (`rsvpEvents`):
 * the guest's own answer and their relatives', what each of them brings, and their amigo oculto
 * entries while the draw is still open. The screens already show an account by its profile
 * name; this keeps what is stored in line too (a relative has no account to look up, so their
 * new name only reaches the events this way).
 *
 * Best effort and quiet: an event that is closed or gone keeps its old copy.
 */
@Injectable({ providedIn: 'root' })
export class NameSyncService {
  private readonly gateway = inject(FirestoreGateway);
  private readonly secretSanta = inject(SecretSantaService);

  /** The account holder renamed themself. */
  async syncOwnName(uid: string, name: string): Promise<void> {
    const clean = name.trim();
    if (!uid || !clean) return;
    await this.eachEvent(uid, (eventId) =>
      Promise.all([
        this.renameGuest(`events/${eventId}/guests/${uid}`, clean),
        this.renameClaims(eventId, uid, null, clean),
        this.renameSantaEntry(eventId, uid, secretSantaRsvpId(uid), clean),
      ]),
    );
  }

  /** A relative on the profile was renamed. */
  async syncFamilyMemberName(uid: string, memberId: string, name: string): Promise<void> {
    const clean = name.trim();
    if (!uid || !memberId || !clean) return;
    await this.eachEvent(uid, (eventId) =>
      Promise.all([
        this.renameGuest(`events/${eventId}/guests/${uid}_${memberId}`, clean),
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

  private async renameGuest(path: string, name: string): Promise<void> {
    const guest = await this.gateway.getDoc<{ name?: string }>(path).catch(() => null);
    if (!guest || guest.name === name) return;
    await this.gateway.updateDoc(path, { name }).catch(() => undefined);
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
