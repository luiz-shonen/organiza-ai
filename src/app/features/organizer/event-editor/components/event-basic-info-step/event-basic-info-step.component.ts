import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  EventCategory,
  EventDateTime,
  EventDescription,
  EventTitle,
  fieldError,
} from '../../../../../core/value-objects';
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

  protected readonly categoryMaxLength = EventCategory.RULES.max;
  /** Set when the organizer picks "Personalizar" to type a category of their own. */
  private readonly customRequested = signal(false);

  /** True while the category is typed instead of picked, including a saved custom one. */
  protected isCustomCategory(): boolean {
    const value = this.form().controls.category.value;
    return this.customRequested() || (value.trim() !== '' && !this.isPreset(value));
  }

  /** A typed date is judged once the field is left; a past date and time right away. */
  protected dateError(): string {
    const form = this.form();
    const date = form.controls.date;
    if (date.touched && date.hasError('invalidDate')) return EventDateTime.INVALID_DATE_MESSAGE;
    if (date.touched && date.hasError('required')) return 'Data é obrigatória';
    if (form.hasError('pastDateTime')) return EventDateTime.PAST_MESSAGE;
    return '';
  }

  protected selectCategory(category: string): void {
    this.customRequested.set(false);
    const control = this.form().controls.category;
    control.setValue(category);
    control.markAsTouched();
  }

  protected selectCustomCategory(): void {
    const control = this.form().controls.category;
    if (this.isPreset(control.value)) control.setValue('');
    this.customRequested.set(true);
  }

  private isPreset(value: string): boolean {
    return this.categories().some((category) => category.name === value);
  }
}
