import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../../core/services';

@Component({
  selector: 'app-admin-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-form-dialog.component.html',
})
export class AdminFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<AdminFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      const { email } = this.form.getRawValue();
      await this.authService.registerAdmin(email);
      this.snackBar.open('Administrador adicionado à whitelist com sucesso!', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error: any) {
      let message = 'Erro ao cadastrar administrador.';
      if (error instanceof Error) {
        message = error.message;
      }
      this.snackBar.open(message, 'OK', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }
}
