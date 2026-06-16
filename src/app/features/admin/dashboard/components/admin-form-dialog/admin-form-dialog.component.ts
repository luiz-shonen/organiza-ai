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
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align: middle; margin-right: 8px;">person_add</mat-icon>
      Novo Administrador
    </h2>
    
    <mat-dialog-content>
      <p style="margin-bottom: 16px; color: var(--mat-sys-on-surface-variant);">
        Cadastre um novo usuário administrador para gerenciar os eventos.
      </p>

      <form [formGroup]="form" id="admin-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 8px;">
          <mat-label>E-mail</mat-label>
          <input matInput type="email" formControlName="email" placeholder="email@exemplo.com" required autocomplete="username" />
          <mat-icon matPrefix>email</mat-icon>
          @if (form.controls.email.hasError('required')) {
            <mat-error>E-mail é obrigatório</mat-error>
          }
          @if (form.controls.email.hasError('email')) {
            <mat-error>E-mail inválido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Senha</mat-label>
          <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Mínimo 6 caracteres" required autocomplete="new-password" />
          <mat-icon matPrefix>lock</mat-icon>
          <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())" [attr.aria-label]="'Ocultar senha'" [attr.aria-pressed]="hidePassword()">
            <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.hasError('required')) {
            <mat-error>Senha é obrigatória</mat-error>
          }
          @if (form.controls.password.hasError('minlength')) {
            <mat-error>Mínimo de 6 caracteres</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="loading()">Cancelar</button>
      <button mat-flat-button type="submit" form="admin-form" [disabled]="form.invalid || loading()">
        @if (loading()) {
          <mat-spinner diameter="20"></mat-spinner>
        }
        @if (!loading()) {
          Cadastrar
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class AdminFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<AdminFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly hidePassword = signal(true);
  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.authService.registerAdmin(email, password);
      this.snackBar.open('Administrador cadastrado com sucesso!', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error: any) {
      let message = 'Erro ao cadastrar administrador.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha é muito fraca.';
      }
      this.snackBar.open(message, 'OK', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }
}
