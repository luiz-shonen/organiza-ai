import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationHistoryService } from './navigation-history.service';

@Component({ template: '' })
class BlankComponent {}

describe('NavigationHistoryService', () => {
  let router: Router;
  let history: NavigationHistoryService;
  const settle = () => new Promise((resolve) => setTimeout(resolve));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: BlankComponent }]),
        provideLocationMocks(),
      ],
    });
    router = TestBed.inject(Router);
    history = TestBed.inject(NavigationHistoryService);
  });

  it('returns to the screen before, not to a fixed parent', async () => {
    await router.navigateByUrl('/meus-eventos');
    await router.navigateByUrl('/evento/abc');
    await router.navigateByUrl('/meus-eventos/evento/abc');
    expect(history.previous()).toBe('/evento/abc');

    const back = vi.spyOn(TestBed.inject(Location), 'back');
    history.back('/meus-eventos');
    expect(back).toHaveBeenCalled();
  });

  it('uses the fallback on the first screen of the tab', async () => {
    await router.navigateByUrl('/evento/abc');
    expect(history.previous()).toBeNull();
    history.back('/');
    await settle();
    expect(TestBed.inject(Location).path()).toBe('/');
  });

  it('a redirect that replaces the screen does not leave it behind', async () => {
    await router.navigateByUrl('/meus-eventos');
    await router.navigateByUrl('/meus-eventos/evento/abc');
    await router.navigateByUrl('/evento/abc', { replaceUrl: true });
    expect(history.previous()).toBe('/meus-eventos');
  });
});
