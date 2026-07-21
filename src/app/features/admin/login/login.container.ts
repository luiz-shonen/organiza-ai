import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
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
  protected readonly isRegisterMode = signal(false);

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');
    const { email, password } = this.form.getRawValue();

    try {
      if (this.isRegisterMode()) {
        await this.authService.register(email, password);
      } else {
        await this.authService.login(email, password);
      }
      await this.redirectAfterAuth();
    } catch (authError: unknown) {
      const msg = authError instanceof Error ? authError.message : String(authError);
      
      if (msg.includes('invalid-credential') || msg.includes('user-not-found') || msg.includes('wrong-password')) {
        this.errorMessage.set('E-mail ou senha incorretos.');
      } else if (msg.includes('email-already-in-use')) {
        this.errorMessage.set('E-mail já está em uso.');
      } else if (msg.includes('weak-password')) {
        this.errorMessage.set('A senha deve ter pelo menos 6 caracteres.');
      } else {
        this.errorMessage.set('Erro na autenticação. Tente novamente.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async redirectAfterAuth(): Promise<void> {
    if (this.authService.isAdmin()) {
      await this.router.navigate(['/admin']);
    } else {
      await this.router.navigate(['/']);
    }
  }

  protected async loginWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.loginWithGoogle();
      await this.redirectAfterAuth();
    } catch (error: unknown) {
      let msg = 'Falha ao autenticar com o Google.';
      if (error instanceof Error && error.message === 'NOT_ADMIN') {
        msg = 'Acesso Negado: Seu e-mail não tem permissão.';
      }
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
