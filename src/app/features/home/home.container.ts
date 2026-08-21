import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EventService } from '../../core/services';
import { OrgButtonDirective, OrgIconComponent, OrgSurfaceComponent } from '../../shared/ui';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatProgressSpinnerModule,
    OrgButtonDirective,
    OrgIconComponent,
    OrgSurfaceComponent,
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
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  protected getDay(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).getDate().toString().padStart(2, '0');
  }

  protected getMonth(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr)
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
      .toUpperCase();
  }

  protected navigateToEvent(eventId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.router.navigate(['/evento', eventId]);
  }
}
