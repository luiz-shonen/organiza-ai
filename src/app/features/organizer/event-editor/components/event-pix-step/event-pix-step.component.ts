import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { fieldError } from '../../../../../core/value-objects';
import { EventPixForm, PIX_PURPOSE_MAX } from '../../../../../core/models';
import {
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgIconComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
  OrgTextareaFieldComponent,
} from '../../../../../shared/ui';

@Component({
  selector: 'app-event-pix-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgIconComponent,
    OrgSurfaceComponent,
    OrgTextFieldComponent,
    OrgTextareaFieldComponent,
  ],
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
  /** Steps that still block saving; empty when everything is filled in. */
  readonly missingSteps = input<readonly string[]>([]);
  readonly back = output<void>();
  readonly save = output<void>();

  protected readonly fieldError = fieldError;
  protected readonly purposeMax = PIX_PURPOSE_MAX;
}
