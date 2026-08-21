import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { UserProfile } from '../../../../core/models';
import { OrgButtonDirective, OrgFormFieldDirective, OrgIconButtonDirective, OrgIconComponent, OrgSurfaceComponent } from '../../../../shared/ui';

@Component({
  selector: 'app-profile-info-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    OrgButtonDirective,
    OrgFormFieldDirective,
    OrgIconButtonDirective,
    OrgIconComponent,
    OrgSurfaceComponent,
  ],
  templateUrl: './profile-info-card.component.html',
  styleUrl: './profile-info-card.component.scss',
})
export class ProfileInfoCardComponent {
  readonly user = input.required<UserProfile>();
  readonly updateName = output<string>();

  readonly isEditing = signal(false);
  readonly editName = signal('');

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        this.editName.set(u.displayName ?? u.name ?? '');
      }
    });
  }

  startEditing(): void {
    const current = this.user();
    this.editName.set(current.displayName ?? current.name ?? '');
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    const current = this.user();
    this.editName.set(current.displayName ?? current.name ?? '');
    this.isEditing.set(false);
  }

  saveName(): void {
    const trimmed = this.editName().trim();
    if (trimmed.length > 0) {
      this.updateName.emit(trimmed);
      this.isEditing.set(false);
    }
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
