import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PartyEvent } from '../../../../core/models';

@Component({
  selector: 'app-event-info-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './event-info-card.component.html',
  styleUrl: './event-info-card.component.scss',
})
export class EventInfoCardComponent {
  readonly event = input.required<PartyEvent>();
}
