import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { OrgButtonDirective } from '../../../shared/ui';

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
    OrgButtonDirective,
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
    const { email, password } = this.form.getRawValue();

    try {
      await this.authService.login(email, password);
      await this.redirectAfterAuth();
    } catch (authError: unknown) {
      const msg = authError instanceof Error ? authError.message : String(authError);

      // If user doesn't exist yet, attempt automatic creation
      if (msg.includes('user-not-found') || msg.includes('invalid-credential')) {
        try {
          await this.authService.register(email, password);
          await this.redirectAfterAuth();
        } catch (regError: unknown) {
          const regMsg = regError instanceof Error ? regError.message : String(regError);
          if (regMsg.includes('email-already-in-use') || regMsg.includes('wrong-password')) {
            this.errorMessage.set('E-mail ou senha incorretos.');
          } else if (regMsg.includes('weak-password')) {
            this.errorMessage.set('A senha deve ter pelo menos 6 caracteres.');
          } else {
            this.errorMessage.set('Erro ao acessar a conta. Tente novamente.');
          }
        }
      } else if (msg.includes('wrong-password')) {
        this.errorMessage.set('E-mail ou senha incorretos.');
      } else {
        this.errorMessage.set('Erro na autenticação. Tente novamente.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async redirectAfterAuth(): Promise<void> {
    await this.router.navigate(['/meus-eventos']);
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
