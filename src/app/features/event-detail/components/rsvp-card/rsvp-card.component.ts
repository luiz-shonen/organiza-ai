import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { RsvpSecretSantaData } from '../../../../core/models';
import { DeclineMessage, Phone } from '../../../../core/value-objects';
import { GiftOptionsFieldComponent } from '../../../../shared/components/gift-options-field/gift-options-field.component';
import {
  OrgButtonComponent,
  OrgCheckboxComponent,
  OrgSurfaceComponent,
  OrgCardHeaderComponent,
  OrgTextFieldComponent,
  OrgTextareaFieldComponent,
} from '../../../../shared/ui';

/** Taking part in the amigo oculto without going: the phone for the link and gift options. */
export interface RsvpSantaJoin {
  readonly phone: string;
  readonly gifts: readonly string[];
}

/** "Não poderei ir": the message for the organizer and, maybe, "quero participar do amigo oculto". */
export interface RsvpDeclineResult {
  readonly message: string;
  /** Null: not in the amigo oculto (or the event has none, or sign-ups are closed). */
  readonly santa: RsvpSantaJoin | null;
}

@Component({
  selector: 'app-rsvp-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    OrgButtonComponent,
    OrgCheckboxComponent,
    OrgSurfaceComponent,
    OrgCardHeaderComponent,
    OrgTextFieldComponent,
    OrgTextareaFieldComponent,
    GiftOptionsFieldComponent,
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
  /** Confirmed, and the event asks for approval: waiting for the owner. */
  readonly pendingApproval = input(false);
  /** The event has an amigo oculto: where the member stands, and whether they may join. */
  readonly secretSanta = input<RsvpSecretSantaData | null>(null);
  /** The member's phone (profile), offered for the amigo oculto link. */
  readonly phone = input('');

  readonly confirmRsvp = output<void>();
  readonly editRsvp = output<void>();
  /** Cancels a confirmed presence, with the optional message for the organizer. */
  readonly cancelRsvp = output<RsvpDeclineResult>();
  /** Declines an invite not answered yet, with the optional message for the organizer. */
  readonly declineRsvp = output<RsvpDeclineResult>();
  /** "Quero participar só do amigo oculto", after declining. */
  readonly joinSanta = output<RsvpSantaJoin>();
  /** "Sair do amigo oculto", after declining. */
  readonly leaveSanta = output<void>();

  /** "Não poderei ir" was pressed: the card asks for an optional message before sending. */
  protected readonly declining = signal(false);
  /** "Quero participar só do amigo oculto" was pressed: the card asks for phone and gifts. */
  protected readonly joiningSanta = signal(false);
  protected readonly message = signal('');
  protected readonly messageMaxLength = DeclineMessage.RULES.max;
  private readonly sendAttempted = signal(false);
  protected readonly messageError = computed(() =>
    this.sendAttempted() ? (DeclineMessage.validate(this.message()) ?? '') : '',
  );

  /** The member is in the draw themself. */
  protected readonly inSanta = computed(() => !!this.secretSanta()?.joined['self']);
  protected readonly santaOpen = computed(() => !!this.secretSanta()?.open);
  /** Leaving is up to the guest until the draw, even with sign-ups closed. */
  protected readonly santaCanLeave = computed(
    () => this.santaOpen() || !!this.secretSanta()?.canLeave,
  );
  /** "Mesmo sem ir, quero participar do amigo oculto" in the decline form. */
  protected readonly santaWanted = signal(false);
  protected readonly santaPhone = signal('');
  protected readonly santaGifts = signal<readonly string[]>([]);
  private readonly giftsField = viewChild(GiftOptionsFieldComponent);
  protected readonly maskPhone = Phone.mask;
  private readonly santaAttempted = signal(false);
  protected readonly santaPhoneError = computed(() => {
    if (!this.santaAttempted()) return '';
    if (!this.santaPhone().trim()) return 'Informe o telefone que vai receber o link';
    return Phone.validate(this.santaPhone()) ?? '';
  });
  protected readonly santaGiftLabel = computed(() =>
    (this.secretSanta()?.maxGiftOptions ?? 1) === 1 ? 'Opção de presente' : 'Opções de presente',
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
    this.resetSanta();
    this.santaWanted.set(this.inSanta());
    this.declining.set(true);
  }

  protected stopDecline(): void {
    this.declining.set(false);
    this.message.set('');
    this.sendAttempted.set(false);
  }

  protected startJoinSanta(): void {
    this.resetSanta();
    this.joiningSanta.set(true);
  }

  protected stopJoinSanta(): void {
    this.joiningSanta.set(false);
  }

  protected sendDecline(): void {
    this.sendAttempted.set(true);
    if (this.isLoading() || DeclineMessage.validate(this.message())) return;
    const wantsSanta = this.santaOpen() && this.santaWanted();
    const santa = wantsSanta ? this.santaJoin() : null;
    if (wantsSanta && !santa) return;
    const result: RsvpDeclineResult = {
      message: DeclineMessage.create(this.message())?.value ?? '',
      santa,
    };
    if (this.isConfirmed()) {
      this.cancelRsvp.emit(result);
    } else {
      this.declineRsvp.emit(result);
    }
    this.stopDecline();
  }

  protected sendJoinSanta(): void {
    if (this.isLoading()) return;
    const santa = this.santaJoin();
    if (!santa) return;
    this.joinSanta.emit(santa);
    this.stopJoinSanta();
  }

  /** The phone and gift options typed, or null (errors shown) when something is wrong. */
  private santaJoin(): RsvpSantaJoin | null {
    this.santaAttempted.set(true);
    const phone = Phone.create(this.santaPhone());
    const wantsGifts = !!this.secretSanta()?.giftOptions;
    // An idea still typed joins the list; with gift options on, at least one is needed.
    const giftsOk = wantsGifts ? (this.giftsField()?.commit(true) ?? true) : true;
    if (!phone || !giftsOk) return null;
    return { phone: phone.formatted, gifts: wantsGifts ? [...this.santaGifts()] : [] };
  }

  private resetSanta(): void {
    this.santaPhone.set(this.phone());
    this.santaGifts.set([...(this.secretSanta()?.joined['self'] ?? [])]);
    this.giftsField()?.reset();
    this.santaAttempted.set(false);
  }
}
