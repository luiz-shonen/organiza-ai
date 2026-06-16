import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { PartyEvent } from '../../../../core/models';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-event-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, ThemeToggleComponent],
  templateUrl: './event-header.component.html',
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
