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
import { MatSidenavModule } from '@angular/material/sidenav';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService, ThemeService, DrawerService, SeasonalThemeService } from './core/services';
import { isPrimaryDestination, resolveBackRoute } from './core/utils';
import { SeasonalOverlayComponent } from './shared/components/seasonal-overlay/seasonal-overlay.component';
import { NavigationDrawerComponent } from './shared/ui/drawer/navigation-drawer.component';
import { OrgIconComponent } from './shared/ui/actions/org-icon.component';
import { OrgIconButtonComponent } from './shared/ui/actions/org-icon-button.component';
import { OrgButtonComponent } from './shared/ui/actions/org-button.component';
import { OrgAvatarComponent } from './shared/ui/data-display/org-avatar.component';
import { OrgThemeToggleComponent } from './shared/ui/actions/org-theme-toggle.component';
import { OrgLogoComponent } from './shared/ui/brand/org-logo.component';
import {
  OrgNavBarComponent,
  type OrgNavBarItem,
} from './shared/ui/navigation/org-nav-bar.component';
import { RsvpDrawerComponent } from './features/event-detail/components/rsvp-drawer/rsvp-drawer.component';
import { CollaboratorDrawerComponent } from './features/organizer/event-editor/components/collaborator-drawer/collaborator-drawer.component';
import type { CollaboratorDrawerResult } from './core/models';
import type { RsvpDrawerResult } from './core/models';

const HOME_ITEM: OrgNavBarItem = {
  route: '/',
  label: 'Início',
  icon: 'home',
  testId: 'nav-home',
  exact: true,
};
const MY_EVENTS_ITEM: OrgNavBarItem = {
  route: '/meus-eventos',
  label: 'Meus eventos',
  icon: 'calendar_month',
  testId: 'nav-my-events',
};
const PROFILE_ITEM: OrgNavBarItem = {
  route: '/perfil',
  label: 'Perfil',
  icon: 'person',
  testId: 'nav-profile',
};

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatSidenavModule,
    SeasonalOverlayComponent,
    NavigationDrawerComponent,
    OrgIconComponent,
    OrgIconButtonComponent,
    OrgButtonComponent,
    OrgAvatarComponent,
    OrgThemeToggleComponent,
    OrgLogoComponent,
    OrgNavBarComponent,
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
  protected readonly drawerService = inject(DrawerService);

  private readonly seasonalService = inject(SeasonalThemeService);
  private readonly renderer = inject(Renderer2);

  // Jakob's law: phones get a bottom bar with the three destinations; the desktop
  // header keeps Início and Meus eventos in the centre and the avatar opens Perfil.
  protected readonly bottomNavItems: readonly OrgNavBarItem[] = [
    HOME_ITEM,
    MY_EVENTS_ITEM,
    PROFILE_ITEM,
  ];
  protected readonly headerNavItems: readonly OrgNavBarItem[] = [HOME_ITEM, MY_EVENTS_ITEM];

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

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => (event as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly showHeader = computed(() => !this.currentUrl().includes('/login'));
  protected readonly isDesignSystemPage = computed(() =>
    this.currentUrl().startsWith('/design-system'),
  );
  protected readonly backRoute = computed(() => resolveBackRoute(this.currentUrl()));
  protected readonly showAvatar = this.isAuthenticated;
  protected readonly showBottomNav = computed(
    () => this.isAuthenticated() && isPrimaryDestination(this.currentUrl()),
  );
  protected readonly isFestiveBackdrop = computed(
    () => this.seasonalService.config().activeTheme === 'default',
  );

  protected async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }

  protected openNavigation(event: Event): void {
    this.drawerService.open({ kind: 'navigation', trigger: event.currentTarget as HTMLElement });
  }

  protected navigate(route: string): void {
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
