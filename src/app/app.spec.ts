import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
