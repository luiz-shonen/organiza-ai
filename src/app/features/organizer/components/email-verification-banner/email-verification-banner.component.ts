import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-email-verification-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './email-verification-banner.component.html',
  styleUrl: './email-verification-banner.component.scss',
})
export class EmailVerificationBannerComponent {
  readonly email = input.required<string>();
  readonly resendCooldown = input<number>(0);
  readonly resend = output<void>();

  onResend(): void {
    if (this.resendCooldown() <= 0) {
      this.resend.emit();
    }
  }
}
