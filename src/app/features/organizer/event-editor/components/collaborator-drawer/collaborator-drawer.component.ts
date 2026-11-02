import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type {
  CollaboratorDrawerRequestData,
  CollaboratorDrawerResult,
} from '../../../../../core/models';
import {
  OrgButtonComponent,
  OrgIconComponent,
  OrgIconButtonComponent,
  OrgTextFieldComponent,
} from '../../../../../shared/ui';
import { Email } from '../../../../../core/value-objects';

@Component({
  selector: 'app-collaborator-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgIconComponent, OrgIconButtonComponent, OrgTextFieldComponent],
  templateUrl: './collaborator-drawer.component.html',
  styleUrl: './collaborator-drawer.component.scss',
})
export class CollaboratorDrawerComponent {
  readonly drawerData = input.required<CollaboratorDrawerRequestData>();
  readonly action = output<CollaboratorDrawerResult>();
  readonly closed = output<void>();
  readonly email = signal('');
  readonly isEmailValid = computed(() => Email.create(this.email()) !== null);
  protected readonly emailMaxLength = Email.MAX;

  protected onInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected invite(): void {
    const email = Email.create(this.email())?.value;
    if (email) {
      this.action.emit({ action: 'invite', email });
      this.email.set('');
    }
  }
}
