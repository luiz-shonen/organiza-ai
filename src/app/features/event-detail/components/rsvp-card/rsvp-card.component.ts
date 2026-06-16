import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GuestSession } from '../../../../core/models';

@Component({
  selector: 'app-rsvp-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './rsvp-card.component.html',
  styleUrl: './rsvp-card.component.scss',
})
export class RsvpCardComponent {
  readonly session = input<GuestSession | null>(null);
  readonly guestCount = input(0);
  readonly rsvpClicked = output<void>();
}
