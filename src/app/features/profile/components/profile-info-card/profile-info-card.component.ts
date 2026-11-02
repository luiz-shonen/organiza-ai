import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import type { UserProfile } from '../../../../core/models';
import { Phone } from '../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgIconButtonComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
} from '../../../../shared/ui';

export interface ProfileDetailsPayload {
  displayName: string;
  /** Empty string clears the phone. */
  phone: string;
}

@Component({
  selector: 'app-profile-info-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgTextFieldComponent, OrgIconButtonComponent, OrgSurfaceComponent],
  templateUrl: './profile-info-card.component.html',
  styleUrl: './profile-info-card.component.scss',
})
export class ProfileInfoCardComponent {
  readonly user = input.required<UserProfile>();
  readonly updateDetails = output<ProfileDetailsPayload>();

  readonly isEditing = signal(false);
  readonly editName = signal('');
  readonly editPhone = signal('');
  /** Set on a save with an invalid phone; the error then follows what is typed. */
  readonly showPhoneError = signal(false);

  protected readonly maskPhone = Phone.mask;
  protected readonly phoneDisplay = computed(() => Phone.display(this.user().phone));
  protected readonly phoneError = computed(() =>
    this.showPhoneError() && this.editPhone() && !Phone.isValid(this.editPhone())
      ? Phone.INVALID_MESSAGE
      : '',
  );

  /** "março de 2026", from the profile creation date. */
  protected readonly memberSince = computed(() => {
    const created = new Date(this.user().createdAt);
    return isNaN(created.getTime())
      ? ''
      : created.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  });

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        this.resetFields(u);
      }
    });
  }

  startEditing(): void {
    this.resetFields(this.user());
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.resetFields(this.user());
    this.isEditing.set(false);
  }

  saveDetails(): void {
    const trimmed = this.editName().trim();
    if (trimmed.length === 0) return;
    const phone = this.editPhone().trim();
    if (phone && !Phone.isValid(phone)) {
      this.showPhoneError.set(true);
      return;
    }
    this.updateDetails.emit({ displayName: trimmed, phone: Phone.create(phone)?.formatted ?? '' });
    this.isEditing.set(false);
  }

  private resetFields(user: UserProfile): void {
    this.editName.set(user.displayName ?? user.name ?? '');
    this.editPhone.set(Phone.mask(user.phone ?? ''));
    this.showPhoneError.set(false);
  }

  get userInitial(): string {
    const name = this.user().displayName ?? this.user().name;
    if (name && name.length > 0) {
      return name.charAt(0).toUpperCase();
    }
    const email = this.user().email;
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  }
}
