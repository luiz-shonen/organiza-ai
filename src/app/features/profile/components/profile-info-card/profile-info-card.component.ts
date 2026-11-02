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
import { PersonName, Phone } from '../../../../core/value-objects';
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
  /** Set on a save with invalid fields; the errors then follow what is typed. */
  readonly showErrors = signal(false);

  protected readonly nameMaxLength = PersonName.MAX;
  protected readonly maskPhone = Phone.mask;
  protected readonly phoneDisplay = computed(() => Phone.display(this.user().phone));
  protected readonly nameError = computed(() => {
    if (this.editName().trim().length === 0) return 'O nome não pode ficar em branco';
    return this.showErrors() ? (PersonName.validate(this.editName()) ?? '') : '';
  });
  protected readonly phoneError = computed(() =>
    this.showErrors() ? (Phone.validate(this.editPhone()) ?? '') : '',
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
    if (this.editName().trim().length === 0) return;
    const name = PersonName.create(this.editName());
    if (!name || Phone.validate(this.editPhone())) {
      this.showErrors.set(true);
      return;
    }
    this.updateDetails.emit({
      displayName: name.value,
      phone: Phone.create(this.editPhone())?.formatted ?? '',
    });
    this.isEditing.set(false);
  }

  private resetFields(user: UserProfile): void {
    this.editName.set(user.displayName ?? user.name ?? '');
    this.editPhone.set(Phone.mask(user.phone ?? ''));
    this.showErrors.set(false);
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
