import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { OrgButtonComponent, OrgIconComponent, OrgSurfaceComponent } from '../../../../shared/ui';

@Component({
  selector: 'app-rsvp-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgIconComponent, OrgSurfaceComponent],
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
