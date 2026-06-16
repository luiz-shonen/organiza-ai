import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
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
  styleUrl: './admin-form-dialog.component.scss',
})
export class AdminFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<AdminFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(false);
  protected readonly admins = signal<string[]>([]);
  protected readonly loadingAdmins = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.loadAdmins();
  }

  private async loadAdmins(): Promise<void> {
    try {
      this.loadingAdmins.set(true);
      const list = await this.authService.listAdmins();
      this.admins.set(list);
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao carregar administradores.', 'OK', { duration: 3000 });
    } finally {
      this.loadingAdmins.set(false);
    }
  }

  protected async removeAdmin(email: string): Promise<void> {
    if (confirm(`Tem certeza que deseja remover ${email}?`)) {
      try {
        await this.authService.removeAdmin(email);
        this.snackBar.open('Administrador removido com sucesso!', 'OK', { duration: 3000 });
        await this.loadAdmins();
      } catch (err: any) {
        this.snackBar.open(err.message || 'Erro ao remover.', 'OK', { duration: 3000 });
      }
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      const { email } = this.form.getRawValue();
      await this.authService.registerAdmin(email);
      this.snackBar.open('Administrador adicionado à whitelist com sucesso!', 'OK', { duration: 3000 });
      this.form.reset();
      await this.loadAdmins();
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
