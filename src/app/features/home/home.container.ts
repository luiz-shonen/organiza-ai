import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EventService } from '../../core/services';
import {
  OrgButtonComponent,
  OrgEmptyStateComponent,
  OrgIconComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  OrgSectionComponent,
  OrgSurfaceComponent,
} from '../../shared/ui';

import { formatDate, getDay, getMonth } from '../../core/utils';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatProgressSpinnerModule,
    OrgButtonComponent,
    OrgIconComponent,
    OrgSurfaceComponent,
    OrgPageLayoutComponent,
    OrgPageHeaderComponent,
    OrgSectionComponent,
    OrgEmptyStateComponent,
  ],
  templateUrl: './home.container.html',
  styleUrl: './home.container.scss',
})
export class HomeContainer {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  protected readonly events = toSignal(this.eventService.listEvents());

  protected formatDate(dateStr: string): string {
    return formatDate(dateStr, 'pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  protected getDay(dateStr: string): string {
    return getDay(dateStr);
  }

  protected getMonth(dateStr: string): string {
    return getMonth(dateStr);
  }

  protected navigateToEvent(eventId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.router.navigate(['/evento', eventId]);
  }

  protected createEvent(): void {
    this.router.navigate(['/meus-eventos/evento/novo']);
  }
}
