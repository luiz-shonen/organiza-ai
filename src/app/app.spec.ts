import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { App } from './app';
import { FirebaseService } from './core/services/firebase.service';
import {
  AuthService,
  GuestSessionService,
  SeasonalThemeService,
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
            logout: vi.fn(),
          },
        },
        {
          provide: SeasonalThemeService,
          useValue: {
            config: signal({ activeTheme: 'default' }),
          },
        },
        {
          provide: GuestSessionService,
          useValue: {
            session: signal(null),
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

  it('should render Meus Eventos button when user is authenticated', () => {
    const authService = TestBed.inject(AuthService) as any;
    authService.currentUser = signal({ uid: 'user-1', email: 'user@test.com', isAnonymous: false });
    authService.isSuperAdmin = signal(false);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const eventsBtn = compiled.querySelector('[data-testid="nav-my-events-btn"]');
    expect(eventsBtn).toBeTruthy();
    expect(eventsBtn?.textContent).toContain('Meus Eventos');

    const adminBtn = compiled.querySelector('[data-testid="nav-admin-panel-btn"]');
    expect(adminBtn).toBeNull();
  });

  it('should render Painel Admin button only when user is Super Admin', () => {
    const authService = TestBed.inject(AuthService) as any;
    authService.currentUser = signal({ uid: 'admin-1', email: 'luiz.gmr.dev@gmail.com', isAnonymous: false });
    authService.isSuperAdmin = signal(true);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const adminBtn = compiled.querySelector('[data-testid="nav-admin-panel-btn"]');
    expect(adminBtn).toBeTruthy();
    expect(adminBtn?.textContent).toContain('Painel Admin');
  });
});

