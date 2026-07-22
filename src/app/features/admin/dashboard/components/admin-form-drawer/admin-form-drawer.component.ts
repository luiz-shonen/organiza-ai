import { Component, ChangeDetectionStrategy, inject, signal, OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService, DrawerService } from '../../../../../core/services';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-form-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-form-drawer.component.html',
  styleUrl: './admin-form-drawer.component.scss',
})
export class AdminFormDrawerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly drawerService = inject(DrawerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly close = output<void>();

  protected readonly loading = signal(false);
  protected readonly admins = signal<string[]>([]);
  protected readonly loadingAdmins = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.loadAdmins();
  }

  protected isSuperAdmin(email: string): boolean {
    return this.authService.isSuperAdminEmail(email);
  }

  private async loadAdmins(): Promise<void> {
    try {
      this.loadingAdmins.set(true);
      const list = await this.authService.listAdmins();
      const sorted = [...list].sort((a, b) => {
        const aSuper = this.authService.isSuperAdminEmail(a);
        const bSuper = this.authService.isSuperAdminEmail(b);
        if (aSuper && !bSuper) return -1;
        if (!aSuper && bSuper) return 1;
        return a.localeCompare(b);
      });
      this.admins.set(sorted);
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao carregar administradores.', 'OK', { duration: 3000 });
    } finally {
      this.loadingAdmins.set(false);
    }
  }

  protected async removeAdmin(email: string): Promise<void> {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remover Administrador',
        message: `Tem certeza que deseja remover ${email}?`,
        confirmLabel: 'Remover',
      },
    });

    confirmRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.authService.removeAdmin(email);
          this.snackBar.open('Administrador removido com sucesso!', 'OK', { duration: 3000 });
          await this.loadAdmins();
        } catch (err: any) {
          this.snackBar.open(err.message || 'Erro ao remover.', 'OK', { duration: 3000 });
        }
      }
    });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      const { email } = this.form.getRawValue();
      await this.authService.registerAdmin(email);
      this.snackBar.open('Administrador adicionado à whitelist com sucesso!', 'OK', {
        duration: 3000,
      });
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

  protected onClose(): void {
    this.close.emit();
    this.drawerService.close();
  }
}
