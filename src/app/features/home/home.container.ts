import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EventService } from '../../core/services';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './home.container.html',
  styleUrl: './home.container.scss',
})
export class HomeContainer {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  protected readonly events = toSignal(this.eventService.listEvents());

  protected formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  protected navigateToEvent(eventId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.router.navigate(['/evento', eventId]);
  }
}
