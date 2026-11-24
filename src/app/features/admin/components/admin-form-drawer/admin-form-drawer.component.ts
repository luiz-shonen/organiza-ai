import { revealFirstInvalidSoon } from '../../../../shared/ui';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  Email,
  fieldError,
  requiredText,
  valueObjectValidator,
} from '../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgIconButtonComponent,
  OrgTextFieldComponent,
} from '../../../../shared/ui';

@Component({
  selector: 'app-admin-form-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OrgButtonComponent, OrgIconButtonComponent, OrgTextFieldComponent],
  templateUrl: './admin-form-drawer.component.html',
  styleUrl: './admin-form-drawer.component.scss',
})
export class AdminFormDrawerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input(false);
  readonly saving = input(false);

  readonly save = output<string>();
  readonly closed = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [requiredText, valueObjectValidator(Email.validate)]],
  });

  protected readonly fieldError = fieldError;
  protected readonly emailMaxLength = Email.MAX;

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      revealFirstInvalidSoon(this.host.nativeElement);
      return;
    }

    const email = Email.create(this.form.getRawValue().email)?.value;
    if (email) {
      this.save.emit(email);
      this.form.reset();
    }
  }

  protected onClose(): void {
    this.form.reset();
    this.closed.emit();
  }
}
