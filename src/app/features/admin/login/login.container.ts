import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
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
  protected readonly isRegisterMode = signal(false);

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const { email, password } = this.form.getRawValue();
      
      if (this.isRegisterMode()) {
        await this.authService.register(email, password);
      } else {
        await this.authService.login(email, password);
      }
      
      if (this.authService.isAdmin()) {
        await this.router.navigate(['/admin']);
      } else {
        await this.router.navigate(['/']);
      }
    } catch (error: unknown) {
      let msg = this.isRegisterMode() 
        ? 'Erro ao criar conta. Tente novamente.' 
        : 'Erro ao fazer login. Tente novamente.';
        
      if (error instanceof Error) {
        if (error.message.includes('invalid-credential')) msg = 'E-mail ou senha incorretos.';
        if (error.message.includes('email-already-in-use')) msg = 'Este e-mail já está em uso.';
        if (error.message.includes('weak-password')) msg = 'A senha é muito fraca.';
        if (error.message === 'NOT_ADMIN') msg = 'Acesso Negado: Seu e-mail não tem permissão.';
      }
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
      if (this.authService.isAdmin()) {
        await this.router.navigate(['/admin']);
      } else {
        await this.router.navigate(['/']);
      }
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
