import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  Renderer2,
} from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import {
  AuthService,
  ThemeService,
  GuestSessionService,
  DrawerService,
  SeasonalThemeService,
  HeaderService,
} from './core/services';
import { SeasonalOverlayComponent } from './shared/components/seasonal-overlay/seasonal-overlay.component';
import { NavigationDrawerComponent } from './shared/ui/drawer/navigation-drawer.component';
import { RsvpDrawerComponent } from './features/event-detail/components/rsvp-drawer/rsvp-drawer.component';
import { CollaboratorDrawerComponent } from './features/organizer/event-editor/components/collaborator-drawer/collaborator-drawer.component';
import type { CollaboratorDrawerResult } from './core/models';
import type { RsvpDrawerResult } from './core/models';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    SeasonalOverlayComponent,
    NavigationDrawerComponent,
    RsvpDrawerComponent,
    CollaboratorDrawerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(window:offline)': 'setOffline()',
    '(window:online)': 'setOnline()',
  },
})
export class App {
  private readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly guestSession = inject(GuestSessionService);
  protected readonly drawerService = inject(DrawerService);
  protected readonly headerService = inject(HeaderService);

  private readonly seasonalService = inject(SeasonalThemeService);
  private readonly renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      const activeTheme = this.seasonalService.config().activeTheme;
      const htmlElement = document.documentElement;

      // Clean up previous seasonal theme classes
      ['theme-junina', 'theme-natal', 'theme-pascoa', 'theme-ano-novo'].forEach((cls) => {
        this.renderer.removeClass(htmlElement, cls);
      });

      // Apply new theme class if not default
      if (activeTheme !== 'default') {
        this.renderer.addClass(htmlElement, `theme-${activeTheme}`);
      }
    });
  }

  protected readonly isSuperAdmin = this.authService.isSuperAdmin;
  protected readonly user = this.authService.currentUser;
  protected readonly isAuthenticated = computed(() => {
    const u = this.user();
    return u !== null && !u.isAnonymous;
  });
  protected readonly isOffline = signal(!navigator.onLine);
  protected readonly session = this.guestSession.session;

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => (event as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly showHeader = computed(() => !this.currentUrl().includes('/login'));

  protected async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }

  protected openNavigation(event: Event): void {
    this.drawerService.open({ kind: 'navigation', trigger: event.currentTarget as HTMLElement });
  }

  protected navigateFromDrawer(route: string): void {
    this.router.navigateByUrl(route).catch(console.error);
  }

  protected completeRsvp(result: RsvpDrawerResult): void {
    this.drawerService.completeRsvp(result);
  }

  protected dispatchCollaboratorAction(result: CollaboratorDrawerResult): void {
    this.drawerService.dispatchCollaboratorAction(result);
  }

  protected setOffline(): void {
    this.isOffline.set(true);
  }

  protected setOnline(): void {
    this.isOffline.set(false);
  }
}
