import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import { DeclineMessage } from '../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgSurfaceComponent,
  OrgCardHeaderComponent,
  OrgTextareaFieldComponent,
} from '../../../../shared/ui';

@Component({
  selector: 'app-rsvp-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgButtonComponent,
    OrgSurfaceComponent,
    OrgCardHeaderComponent,
    OrgTextareaFieldComponent,
  ],
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
  /** Cancels a confirmed presence, with the optional message for the organizer. */
  readonly cancelRsvp = output<string>();
  /** Declines an invite not answered yet, with the optional message for the organizer. */
  readonly declineRsvp = output<string>();

  /** "Não poderei ir" was pressed: the card asks for an optional message before sending. */
  protected readonly declining = signal(false);
  protected readonly message = signal('');
  protected readonly messageMaxLength = DeclineMessage.RULES.max;
  private readonly sendAttempted = signal(false);
  protected readonly messageError = computed(() =>
    this.sendAttempted() ? (DeclineMessage.validate(this.message()) ?? '') : '',
  );

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

  protected startDecline(): void {
    this.declining.set(true);
  }

  protected stopDecline(): void {
    this.declining.set(false);
    this.message.set('');
    this.sendAttempted.set(false);
  }

  protected sendDecline(): void {
    this.sendAttempted.set(true);
    if (this.isLoading() || DeclineMessage.validate(this.message())) return;
    const message = DeclineMessage.create(this.message())?.value ?? '';
    if (this.isConfirmed()) {
      this.cancelRsvp.emit(message);
    } else {
      this.declineRsvp.emit(message);
    }
    this.stopDecline();
  }
}
