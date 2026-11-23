import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { App } from './app';
import { FirebaseService } from './core/services/firebase.service';
import { of } from 'rxjs';
import {
  AuthService,
  CollaboratorInvitesService,
  EventService,
  InboxService,
  SeasonalThemeService,
  UserService,
} from './core/services';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: FirebaseService,
          useValue: { firestore: {}, auth: {} },
        },
        {
          provide: AuthService,
          useValue: {
            isAdmin: signal(false),
            currentUser: signal(null),
            displayName: signal(''),
            logout: vi.fn(),
          },
        },
        // The bell and the sign-in sync read Firestore: stand-ins here.
        {
          provide: InboxService,
          useValue: { watchUnread: () => of([]), watchAll: () => of([]), markRead: vi.fn() },
        },
        {
          provide: CollaboratorInvitesService,
          useValue: {
            invites: signal([]),
            refresh: vi.fn().mockResolvedValue(undefined),
            watch: vi.fn(),
            backfillHistory: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: UserService,
          useValue: {
            syncPublicName: vi.fn().mockResolvedValue(undefined),
            getProfile: vi.fn().mockResolvedValue(null),
            updateThemePreference: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EventService,
          useValue: { recordCollaboratorEmail: vi.fn().mockResolvedValue(undefined) },
        },
        {
          provide: SeasonalThemeService,
          useValue: {
            config: signal({ activeTheme: 'default' }),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('replaces the hamburger with header navigation and a profile avatar', () => {
    Object.assign(TestBed.inject(AuthService), {
      currentUser: signal({ uid: 'user-1', email: 'user@test.com', isAnonymous: false }),
      isSuperAdmin: signal(false),
    });

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="navigation-menu-trigger"]')).toBeNull();
    const headerNav = compiled.querySelector('.app-toolbar org-nav-bar');
    expect(headerNav?.textContent).toContain('Início');
    expect(headerNav?.textContent).toContain('Meus eventos');
    expect(headerNav?.textContent).not.toContain('Perfil');
    const avatar = compiled.querySelector('[data-testid="header-profile-link"]');
    expect(avatar?.getAttribute('href')).toBe('/perfil');
    expect(avatar?.getAttribute('aria-label')).toBe('Meu perfil · user@test.com');
  });

  it('shows the bottom bar with the three destinations on the home page', () => {
    Object.assign(TestBed.inject(AuthService), {
      currentUser: signal({ uid: 'user-1', email: 'user@test.com', isAnonymous: false }),
      isSuperAdmin: signal(false),
    });

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const bottomNav = (fixture.nativeElement as HTMLElement).querySelector('.app-bottom-nav');
    const links = Array.from(bottomNav?.querySelectorAll('a') ?? []);
    const labels = links.map((link) =>
      link.querySelector('.org-nav-bar__label')?.textContent?.trim(),
    );
    expect(labels).toEqual(['Início', 'Meus eventos', 'Perfil']);
    expect(links[0].getAttribute('aria-current')).toBe('page');
  });

  it('offers an Entrar button (not a bare link) to visitors and hides the bottom bar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const login = compiled.querySelector('[data-testid="header-login-btn"]');
    expect(login?.tagName).toBe('BUTTON');
    expect(login?.textContent).toContain('Entrar');
    expect(compiled.querySelector('.app-bottom-nav')).toBeNull();
  });
});
