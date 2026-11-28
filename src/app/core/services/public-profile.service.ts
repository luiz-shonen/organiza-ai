import { Injectable, computed, inject, signal } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  of,
  race,
  switchMap,
  take,
  timeout,
  timer,
} from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';

/** What anyone may read about an account: `publicProfiles/{uid}`. */
export interface PublicProfile {
  readonly name: string;
  readonly photoURL: string | null;
}

/** Firestore answers an `in` query on the document id for at most 30 ids. */
export const PROFILES_PER_QUERY = 30;

/** How long an awaited lookup waits for the server before answering with what it has. */
const LOOKUP_TIMEOUT_MS = 8000;

type ProfileStore = Readonly<Record<string, PublicProfile | null>>;

/**
 * The one place the app reads people with an account: name and photo by uid, from
 * `publicProfiles/{uid}`. Events keep only the uid; screens join it with the profile here.
 *
 * Every person is read once and then kept live: unknown uids are grouped (up to 30 per query,
 * `documentId in`) into one listener, and that listener stays for the session, shared by every
 * screen that shows the person. A renamed profile reaches all of them at once, and nothing is
 * ever written back into the events.
 *
 * `null` in the store means "read, and there is no profile": the screen falls back to what the
 * event stored before (older data, until the migration script runs).
 */
@Injectable({ providedIn: 'root' })
export class PublicProfileService {
  private readonly gateway = inject(FirestoreGateway);

  private readonly store$ = new BehaviorSubject<ProfileStore>({});
  private readonly store = signal<ProfileStore>({});
  /** Uids someone already listens to (or is about to). */
  private readonly watched = new Set<string>();
  private readonly pending = new Set<string>();
  private flushQueued = false;

  /** Every profile read so far, by uid (accounts without one are left out). Live. */
  readonly profiles = computed<Readonly<Record<string, PublicProfile>>>(() => {
    const found: Record<string, PublicProfile> = {};
    for (const [uid, profile] of Object.entries(this.store())) {
      if (profile) found[uid] = profile;
    }
    return found;
  });

  /** Starts listening to these accounts (a no-op for those already listened to). */
  watch(uids: Iterable<string | null | undefined>): void {
    for (const uid of uids) {
      if (!uid || this.watched.has(uid)) continue;
      this.watched.add(uid);
      this.pending.add(uid);
    }
    if (!this.pending.size || this.flushQueued) return;
    // Uids asked for in the same tick share queries.
    this.flushQueued = true;
    queueMicrotask(() => this.flush());
  }

  /**
   * The profiles of these accounts, live: first once each was read (or after a few seconds,
   * with what arrived), then again whenever one of them changes.
   */
  profilesOf$(
    uids: readonly (string | null | undefined)[],
  ): Observable<Record<string, PublicProfile>> {
    const wanted = [...new Set(uids.filter((uid): uid is string => !!uid))];
    if (!wanted.length) return of({});
    this.watch(wanted);
    const loaded$ = this.store$.pipe(filter((store) => wanted.every((uid) => uid in store)));
    return race(loaded$.pipe(take(1)), timer(LOOKUP_TIMEOUT_MS)).pipe(
      switchMap(() => this.store$),
      map((store) => pick(store, wanted)),
      distinctUntilChanged(sameProfiles),
    );
  }

  /**
   * The profiles of these accounts once each was read (or after a few seconds, with what
   * arrived): for code that answers once, such as a list built on demand.
   */
  async lookup(
    uids: readonly (string | null | undefined)[],
  ): Promise<Record<string, PublicProfile>> {
    const wanted = [...new Set(uids.filter((uid): uid is string => !!uid))];
    if (!wanted.length) return {};
    this.watch(wanted);
    const loaded = (store: ProfileStore) => wanted.every((uid) => uid in store);
    return firstValueFrom(
      this.store$.pipe(
        filter(loaded),
        map((store) => pick(store, wanted)),
        timeout({ first: LOOKUP_TIMEOUT_MS, with: () => of(pick(this.store$.value, wanted)) }),
      ),
    );
  }

  /** The person's own save shows at once, before the server answers. */
  setOwn(uid: string, profile: PublicProfile): void {
    if (!uid) return;
    this.commit({ [uid]: profile });
  }

  private flush(): void {
    this.flushQueued = false;
    const uids = [...this.pending];
    this.pending.clear();
    for (let i = 0; i < uids.length; i += PROFILES_PER_QUERY) {
      this.listen(uids.slice(i, i + PROFILES_PER_QUERY));
    }
  }

  private listen(chunk: readonly string[]): void {
    this.gateway
      .collectionSnapshot<{
        name?: string;
        photoURL?: string | null;
      }>('publicProfiles', this.gateway.whereIdIn(chunk))
      .subscribe({
        next: (docs) => {
          const byId = new Map(docs.map((doc) => [doc.id, doc]));
          const update: Record<string, PublicProfile | null> = {};
          for (const uid of chunk) {
            const doc = byId.get(uid);
            const name = doc?.name?.trim();
            update[uid] = name ? { name, photoURL: doc?.photoURL || null } : null;
          }
          this.commit(update);
        },
        // Offline or refused: these people show the name the event stored, and a later
        // screen asking for them listens again.
        error: () => {
          chunk.forEach((uid) => this.watched.delete(uid));
          const missing = chunk.filter((uid) => !(uid in this.store$.value));
          this.commit(Object.fromEntries(missing.map((uid) => [uid, null])));
        },
      });
  }

  private commit(update: Record<string, PublicProfile | null>): void {
    const current = this.store$.value;
    const changed = Object.entries(update).some(
      ([uid, profile]) => !(uid in current) || !sameProfile(current[uid] ?? null, profile),
    );
    if (!changed) return;
    const next = { ...current, ...update };
    this.store$.next(next);
    this.store.set(next);
  }
}

function pick(store: ProfileStore, uids: readonly string[]): Record<string, PublicProfile> {
  const found: Record<string, PublicProfile> = {};
  for (const uid of uids) {
    const profile = store[uid];
    if (profile) found[uid] = profile;
  }
  return found;
}

function sameProfile(a: PublicProfile | null, b: PublicProfile | null): boolean {
  return a === b || (!!a && !!b && a.name === b.name && a.photoURL === b.photoURL);
}

function sameProfiles(a: Record<string, PublicProfile>, b: Record<string, PublicProfile>): boolean {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((uid) => sameProfile(a[uid], b[uid] ?? null))
  );
}
