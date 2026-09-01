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
  readonly isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()));

  protected onInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected invite(): void {
    const email = this.email().trim().toLowerCase();
    if (this.isEmailValid()) {
      this.action.emit({ action: 'invite', email });
      this.email.set('');
    }
  }
}
