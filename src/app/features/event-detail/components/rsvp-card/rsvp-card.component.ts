import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import {
  OrgButtonComponent,
  OrgSurfaceComponent,
  OrgCardHeaderComponent,
} from '../../../../shared/ui';

@Component({
  selector: 'app-rsvp-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgSurfaceComponent, OrgCardHeaderComponent],
  templateUrl: './rsvp-card.component.html',
  styleUrl: './rsvp-card.component.scss',
})
export class RsvpCardComponent {
  readonly isConfirmed = input<boolean>(false);
  /** The member said they cannot attend; they can still confirm. */
  readonly isDeclined = input<boolean>(false);
  /** Only a signed-in member can record a decline. */
  readonly canDecline = input<boolean>(false);
  /** The household already picked items, so "escolha abaixo" is no longer needed. */
  readonly bringsSomething = input<boolean>(false);
  /** The event has a list of things to bring; without one the card does not mention items. */
  readonly hasItems = input<boolean>(true);
  readonly guestCount = input<number>(0);
  readonly isLoading = input<boolean>(false);
  readonly guestName = input<string | null>(null);

  readonly confirmRsvp = output<void>();
  readonly editRsvp = output<void>();
  readonly cancelRsvp = output<void>();
  readonly declineRsvp = output<void>();

  protected onConfirm(): void {
    if (!this.isLoading()) {
      this.confirmRsvp.emit();
    }
  }

  protected onEdit(): void {
    if (!this.isLoading()) {
      this.editRsvp.emit();
    }
  }

  protected onCancel(): void {
    if (!this.isLoading()) {
      this.cancelRsvp.emit();
    }
  }

  protected onDecline(): void {
    if (!this.isLoading()) {
      this.declineRsvp.emit();
    }
  }
}
