import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService, ThemeService, GuestSessionService } from './core/services';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';
import { SeasonalOverlayComponent } from './shared/components/seasonal-overlay/seasonal-overlay.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, ThemeToggleComponent, SeasonalOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(window:offline)': 'setOffline()',
    '(window:online)': 'setOnline()'
  }
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly guestSession = inject(GuestSessionService);
  
  protected readonly isAdmin = this.authService.isAdmin;
  protected readonly user = this.authService.currentUser;
  protected readonly isOffline = signal(!navigator.onLine);
  protected readonly session = this.guestSession.session;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  protected readonly showHeader = computed(() => !this.currentUrl().includes('/login'));

  protected async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }

  protected setOffline(): void {
    this.isOffline.set(true);
  }

  protected setOnline(): void {
    this.isOffline.set(false);
  }
}
