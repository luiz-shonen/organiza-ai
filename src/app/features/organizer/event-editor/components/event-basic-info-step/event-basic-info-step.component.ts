import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EventBasicInfoForm, EventCategoryOption } from '../../../../../core/models';
import {
  OrgButtonComponent,
  OrgChipComponent,
  OrgDateFieldComponent,
  OrgTextFieldComponent,
  OrgTextareaFieldComponent,
  OrgTimeFieldComponent,
} from '../../../../../shared/ui';

@Component({
  selector: 'app-event-basic-info-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OrgButtonComponent,
    OrgChipComponent,
    OrgDateFieldComponent,
    OrgTextFieldComponent,
    OrgTextareaFieldComponent,
    OrgTimeFieldComponent,
  ],
  templateUrl: './event-basic-info-step.component.html',
  styleUrl: '../event-step.scss',
})
export class EventBasicInfoStepComponent {
  readonly form = input.required<EventBasicInfoForm>();
  readonly categories = input.required<readonly EventCategoryOption[]>();
  readonly minDate = input.required<Date>();
  readonly next = output<void>();

  protected selectCategory(category: string): void {
    const control = this.form().controls.category;
    control.setValue(category);
    control.markAsTouched();
  }
}
