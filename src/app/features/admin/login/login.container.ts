import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.container.html',
  styleUrl: './login.container.scss',
})
export class LoginContainer {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly hidePassword = signal(true);

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const { email, password } = this.form.getRawValue();
      await this.authService.login(email, password);
      await this.router.navigate(['/admin']);
    } catch (error: unknown) {
      const msg =
        error instanceof Error && error.message.includes('invalid-credential')
          ? 'E-mail ou senha incorretos.'
          : 'Erro ao fazer login. Tente novamente.';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  protected async loginWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.loginWithGoogle();
      await this.router.navigate(['/admin']);
    } catch (error: unknown) {
      this.errorMessage.set('Falha ao autenticar com o Google.');
    } finally {
      this.loading.set(false);
    }
  }
}
