import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SwUpdate, type VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppUpdateService } from './app-update.service';

describe('AppUpdateService', () => {
  let versions: Subject<VersionEvent>;
  let sw: {
    isEnabled: boolean;
    versionUpdates: Subject<VersionEvent>;
    unrecoverable: Subject<unknown>;
    checkForUpdate: ReturnType<typeof vi.fn>;
    activateUpdate: ReturnType<typeof vi.fn>;
  };
  let service: AppUpdateService;
  let reload: ReturnType<typeof vi.fn>;
  const ready = { type: 'VERSION_READY' } as VersionEvent;
  const settle = () => new Promise((resolve) => setTimeout(resolve));

  beforeEach(() => {
    versions = new Subject<VersionEvent>();
    sw = {
      isEnabled: true,
      versionUpdates: versions,
      unrecoverable: new Subject(),
      checkForUpdate: vi.fn().mockResolvedValue(false),
      activateUpdate: vi.fn().mockResolvedValue(true),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SwUpdate, useValue: sw },
      ],
    });
    service = TestBed.inject(AppUpdateService);
    reload = vi.spyOn(service, 'reload').mockImplementation(() => undefined) as never;
  });

  afterEach(() => TestBed.resetTestingModule());

  it('asks for a new version as soon as the app opens', () => {
    service.start();
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('switches at once when the person has not touched the page yet', async () => {
    service.start();
    versions.next(ready);
    await settle();
    expect(sw.activateUpdate).toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('waits for the next page when the person is using the app, so nothing typed is lost', async () => {
    service.start();
    document.dispatchEvent(new KeyboardEvent('keydown'));
    versions.next(ready);
    await settle();
    expect(reload).not.toHaveBeenCalled();

    await TestBed.inject(Router).navigateByUrl('/outra-tela');
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does nothing without a service worker (local development)', () => {
    sw.isEnabled = false;
    service.start();
    expect(sw.checkForUpdate).not.toHaveBeenCalled();
  });
});
