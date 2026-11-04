import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services';
import { Email, requiredText, valueObjectValidator } from '../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgIconComponent,
  OrgLogoComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
} from '../../../shared/ui';

const WRONG_CREDENTIALS = 'E-mail ou senha incorretos.';

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Firebase puts the code in the message ("Firebase: Error (auth/wrong-password)."). */
function authErrorMessage(message: string, fallback: string): string {
  if (message.includes('wrong-password') || message.includes('invalid-credential')) {
    return WRONG_CREDENTIALS;
  }
  if (message.includes('weak-password')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (message.includes('too-many-requests')) {
    return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  }
  if (message.includes('network-request-failed')) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  if (message.includes('user-disabled')) return 'Esta conta foi desativada.';
  if (message.includes('api-key-not-valid') || message.includes('invalid-api-key')) {
    return 'O app está sem a configuração do Firebase. Avise o responsável.';
  }
  return fallback;
}

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OrgButtonComponent,
    OrgIconComponent,
    OrgLogoComponent,
    OrgTextFieldComponent,
    OrgSurfaceComponent,
  ],
  templateUrl: './login.container.html',
  styleUrl: './login.container.scss',
})
export class LoginContainer {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [requiredText, valueObjectValidator(Email.validate)]],
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
      const msg = errorText(authError);

      // If user doesn't exist yet, attempt automatic creation
      if (msg.includes('user-not-found') || msg.includes('invalid-credential')) {
        try {
          await this.authService.register(email, password);
          await this.redirectAfterAuth();
        } catch (regError: unknown) {
          const regMsg = errorText(regError);
          // The e-mail already has an account, so the password was the wrong part.
          this.errorMessage.set(
            regMsg.includes('email-already-in-use')
              ? WRONG_CREDENTIALS
              : authErrorMessage(regMsg, 'Erro ao acessar a conta. Tente novamente.'),
          );
        }
      } else {
        this.errorMessage.set(authErrorMessage(msg, 'Erro na autenticação. Tente novamente.'));
      }
    } finally {
      this.loading.set(false);
    }
  }

  /** Back to the invite that sent the guest here, or to Meus eventos. Only app paths. */
  private async redirectAfterAuth(): Promise<void> {
    const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '';
    if (redirect.startsWith('/') && !redirect.startsWith('//')) {
      await this.router.navigateByUrl(redirect);
      return;
    }
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
