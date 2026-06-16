import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './core/services';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(window:offline)': 'setOffline()',
    '(window:online)': 'setOnline()'
  }
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly isAdmin = this.authService.isAdmin;
  protected readonly userName = computed(() => this.authService.currentUser()?.email ?? '');
  protected readonly isOffline = signal(!navigator.onLine);

  protected async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/admin/login']);
  }

  protected setOffline(): void {
    this.isOffline.set(true);
  }

  protected setOnline(): void {
    this.isOffline.set(false);
  }
}
