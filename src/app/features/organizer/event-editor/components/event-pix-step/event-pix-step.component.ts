import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EventPixForm } from '../../../../../core/models';
import {
  OrgButtonComponent,
  OrgIconComponent,
  OrgTextFieldComponent,
} from '../../../../../shared/ui';

@Component({
  selector: 'app-event-pix-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OrgButtonComponent, OrgIconComponent, OrgTextFieldComponent],
  templateUrl: './event-pix-step.component.html',
  styleUrl: '../event-step.scss',
})
export class EventPixStepComponent {
  readonly form = input.required<EventPixForm>();
  /** Only the event owner may persist the core event data. */
  readonly canSave = input(true);
  readonly isEditing = input(false);
  readonly saving = input(false);
  /** Every step of the event form is valid. */
  readonly complete = input(false);
  readonly back = output<void>();
  readonly save = output<void>();
}
