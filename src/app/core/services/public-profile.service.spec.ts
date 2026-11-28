import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { FirestoreGateway } from './firestore.gateway';
import { PROFILES_PER_QUERY, PublicProfileService } from './public-profile.service';
import { createMockFirestoreGateway, type MockFirestoreGateway } from '../../testing/mocks';

interface ProfileDoc {
  id: string;
  name?: string;
  photoURL?: string | null;
}

describe('PublicProfileService', () => {
  let gateway: MockFirestoreGateway;
  let service: PublicProfileService;
  /** One live query per listener, in the order they were opened. */
  let listeners: { ids: string[]; docs$: Subject<ProfileDoc[]> }[];

  const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve));

  beforeEach(() => {
    gateway = createMockFirestoreGateway();
    listeners = [];
    gateway.collectionSnapshot.mockImplementation(
      (_path: string, constraint: { ids: string[] }) => {
        const docs$ = new Subject<ProfileDoc[]>();
        listeners.push({ ids: constraint.ids, docs$ });
        return docs$;
      },
    );
    TestBed.configureTestingModule({
      providers: [PublicProfileService, { provide: FirestoreGateway, useValue: gateway }],
    });
    service = TestBed.inject(PublicProfileService);
  });

  it('reads up to 30 people per query, by document id', async () => {
    const uids = Array.from({ length: PROFILES_PER_QUERY + 5 }, (_, i) => `u${i}`);
    service.watch(uids);
    await tick();

    expect(listeners.map((l) => l.ids.length)).toEqual([PROFILES_PER_QUERY, 5]);
    expect(gateway.collectionSnapshot).toHaveBeenCalledWith('publicProfiles', expect.anything());
    expect(gateway.whereIdIn).toHaveBeenCalledWith(uids.slice(0, PROFILES_PER_QUERY));
  });

  it('keeps one listener per person, shared by every screen that asks', async () => {
    service.watch(['ana', 'bia']);
    service.watch(['bia', 'caio']);
    await tick();
    service.watch(['ana', 'caio']);
    await tick();

    expect(listeners).toHaveLength(1);
    expect(listeners[0].ids).toEqual(['ana', 'bia', 'caio']);
  });

  it('follows a renamed profile live', async () => {
    const seen: string[] = [];
    service.profilesOf$(['ana']).subscribe((profiles) => seen.push(profiles['ana']?.name ?? '-'));
    await tick();

    listeners[0].docs$.next([{ id: 'ana', name: 'Ana' }]);
    listeners[0].docs$.next([{ id: 'ana', name: 'Ana Souza' }]);

    expect(seen).toEqual(['Ana', 'Ana Souza']);
    expect(service.profiles()['ana']).toEqual({ name: 'Ana Souza', photoURL: null });
  });

  it('answers a lookup once every person was read, leaving out who has no profile', async () => {
    const answer = service.lookup(['ana', 'sem-perfil']);
    await tick();
    listeners[0].docs$.next([{ id: 'ana', name: ' Ana ', photoURL: 'https://foto' }]);

    expect(await answer).toEqual({ ana: { name: 'Ana', photoURL: 'https://foto' } });
  });

  it("shows the person's own save at once", async () => {
    service.setOwn('ana', { name: 'Ana Nova', photoURL: null });

    expect(await firstValueFrom(service.profilesOf$(['ana']))).toEqual({
      ana: { name: 'Ana Nova', photoURL: null },
    });
  });

  it('falls back to nothing when the profiles cannot be read, and asks again later', async () => {
    const answer = service.lookup(['ana']);
    await tick();
    listeners[0].docs$.error(new Error('offline'));

    expect(await answer).toEqual({});
    service.watch(['ana']);
    await tick();
    expect(listeners).toHaveLength(2);
  });
});
