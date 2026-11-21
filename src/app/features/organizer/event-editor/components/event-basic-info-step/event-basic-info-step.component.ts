import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  EventCategory,
  EventDateTime,
  EventDescription,
  EventTitle,
  END_BEFORE_START_MESSAGE,
  fieldError,
} from '../../../../../core/value-objects';
import { EventBasicInfoForm, EventCategoryOption } from '../../../../../core/models';
import { joinLabels, revealFirstInvalid } from '../step-validation';
import {
  OrgBannerComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgChipComponent,
  OrgEditableChipComponent,
  OrgDateFieldComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
  OrgTextareaFieldComponent,
  OrgTimeFieldComponent,
  OrgToggleComponent,
} from '../../../../../shared/ui';

@Component({
  selector: 'app-event-basic-info-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OrgBannerComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgChipComponent,
    OrgEditableChipComponent,
    OrgDateFieldComponent,
    OrgSurfaceComponent,
    OrgTextFieldComponent,
    OrgTextareaFieldComponent,
    OrgTimeFieldComponent,
    OrgToggleComponent,
  ],
  templateUrl: './event-basic-info-step.component.html',
  styleUrl: '../event-step.scss',
})
export class EventBasicInfoStepComponent {
  readonly form = input.required<EventBasicInfoForm>();
  readonly categories = input.required<readonly EventCategoryOption[]>();
  readonly minDate = input.required<Date>();
  /** "Aprovar presenças": off by default, anyone with the link confirms. */
  readonly requireApproval = model(false);
  /** Only the owner changes it. */
  readonly canConfigureApproval = input(true);
  readonly next = output<void>();
  readonly cancelled = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Set once "Próximo" was pressed with something missing; the message then follows the form. */
  private readonly attempted = signal(false);

  protected readonly fieldError = fieldError;
  protected readonly titleMaxLength = EventTitle.RULES.max;
  protected readonly descriptionMaxLength = EventDescription.RULES.max;

  protected readonly categoryMaxLength = EventCategory.RULES.max;
  /** The category when it is one the organizer typed, not one of the chips. */
  protected customCategory(): string {
    const value = this.form().controls.category.value.trim();
    return value && !this.isPreset(value) ? value : '';
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

  /** "Data de término" is optional; when typed it must be a real day, not before the start. */
  protected endDateError(): string {
    const form = this.form();
    const endDate = form.controls.endDate;
    if (endDate.touched && endDate.hasError('invalidDate')) {
      return EventDateTime.INVALID_DATE_MESSAGE;
    }
    if (form.hasError('endBeforeStart')) return END_BEFORE_START_MESSAGE;
    return '';
  }

  /** Moves on when the step is complete; otherwise says what is missing and shows the field. */
  protected tryNext(): void {
    const form = this.form();
    if (form.valid) {
      this.attempted.set(false);
      this.next.emit();
      return;
    }
    form.markAllAsTouched();
    this.attempted.set(true);
    setTimeout(() => revealFirstInvalid(this.host.nativeElement));
  }

  /** Why "Próximo" does not move on yet, in plain words. */
  protected missingMessage(): string {
    if (!this.attempted()) return '';
    const form = this.form();
    if (form.valid) return '';
    const { title, category, date, endDate, time } = form.controls;
    const missing: string[] = [];
    if (title.invalid) missing.push('o título');
    if (category.invalid) missing.push('a categoria');
    if (date.invalid) missing.push('a data');
    if (time.invalid) missing.push('a hora');
    if (endDate.invalid) missing.push('a data de término (ou deixe vazia)');
    if (missing.length) return `Para continuar, preencha ${joinLabels(missing)}.`;
    if (form.hasError('pastDateTime')) {
      return 'Para continuar, escolha uma data e hora que ainda não passaram.';
    }
    if (form.hasError('endBeforeStart')) {
      return 'Para continuar, escolha um término no dia do início ou depois.';
    }
    return 'Para continuar, confira os campos marcados em vermelho.';
  }

  protected selectCategory(category: string): void {
    const control = this.form().controls.category;
    control.setValue(category);
    control.markAsTouched();
    control.markAsDirty();
  }

  protected clearCategory(): void {
    const control = this.form().controls.category;
    control.setValue('');
    control.markAsTouched();
    control.markAsDirty();
  }

  private isPreset(value: string): boolean {
    return this.categories().some((category) => category.name === value);
  }
}
