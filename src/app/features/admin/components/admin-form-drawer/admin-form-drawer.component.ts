import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  OrgButtonComponent,
  OrgIconButtonComponent,
  OrgTextFieldComponent,
} from '../../../../shared/ui';

@Component({
  selector: 'app-admin-form-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OrgButtonComponent,
    OrgIconButtonComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './admin-form-drawer.component.html',
  styleUrl: './admin-form-drawer.component.scss',
})
export class AdminFormDrawerComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input(false);
  readonly saving = input(false);

  readonly save = output<string>();
  readonly close = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.getRawValue().email.trim();
    if (email) {
      this.save.emit(email);
      this.form.reset();
    }
  }

  protected onClose(): void {
    this.form.reset();
    this.close.emit();
  }
}
