import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EventDescription, EventTitle, fieldError } from '../../../../../core/value-objects';
import { EventBasicInfoForm, EventCategoryOption } from '../../../../../core/models';
import {
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgChipComponent,
  OrgDateFieldComponent,
  OrgSurfaceComponent,
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
    OrgCardHeaderComponent,
    OrgChipComponent,
    OrgDateFieldComponent,
    OrgSurfaceComponent,
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
  readonly cancelled = output<void>();

  protected readonly fieldError = fieldError;
  protected readonly titleMaxLength = EventTitle.RULES.max;
  protected readonly descriptionMaxLength = EventDescription.RULES.max;

  protected selectCategory(category: string): void {
    const control = this.form().controls.category;
    control.setValue(category);
    control.markAsTouched();
  }
}
