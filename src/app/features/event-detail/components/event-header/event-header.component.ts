import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PartyEvent } from '../../../../core/models';

@Component({
  selector: 'app-event-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <header class="event-header" role="banner">
      <div class="event-header__content">
        <h1 class="event-header__title">{{ event().title }}</h1>
        <div class="event-header__meta">
          <span class="event-header__detail">
            <mat-icon>calendar_today</mat-icon>
            {{ formatDate(event().date) }}
          </span>
          <span class="event-header__detail">
            <mat-icon>location_on</mat-icon>
            {{ event().location }}
          </span>
          <span class="event-header__detail">
            <mat-icon>group</mat-icon>
            {{ guestCount() }} {{ guestCount() === 1 ? 'confirmado' : 'confirmados' }}
          </span>
        </div>
      </div>
    </header>
  `,
  styleUrl: './event-header.component.scss',
})
export class EventHeaderComponent {
  readonly event = input.required<PartyEvent>();
  readonly guestCount = input(0);

  protected formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
