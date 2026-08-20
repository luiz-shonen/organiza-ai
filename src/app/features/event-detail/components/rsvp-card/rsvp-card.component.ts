import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-rsvp-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './rsvp-card.component.html',
  styleUrl: './rsvp-card.component.scss',
})
export class RsvpCardComponent {
  readonly isConfirmed = input<boolean>(false);
  readonly guestCount = input<number>(0);
  readonly isLoading = input<boolean>(false);
  readonly guestName = input<string | null>(null);

  readonly confirmRsvp = output<void>();
  readonly cancelRsvp = output<void>();

  protected onConfirm(): void {
    if (!this.isLoading()) {
      this.confirmRsvp.emit();
    }
  }

  protected onCancel(): void {
    if (!this.isLoading()) {
      this.cancelRsvp.emit();
    }
  }
}
