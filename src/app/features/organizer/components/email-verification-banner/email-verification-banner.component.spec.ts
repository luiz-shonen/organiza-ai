import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmailVerificationBannerComponent } from './email-verification-banner.component';

describe('EmailVerificationBannerComponent', () => {
  let component: EmailVerificationBannerComponent;
  let fixture: ComponentFixture<EmailVerificationBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailVerificationBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailVerificationBannerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('email', 'organizer@example.com');
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render banner with role="alert" and aria-label', () => {
    const bannerEl = fixture.nativeElement.querySelector('.org-email-banner');
    expect(bannerEl).toBeTruthy();
    expect(bannerEl.getAttribute('role')).toBe('alert');
    expect(bannerEl.getAttribute('aria-label')).toBe('Aviso de verificação de e-mail');
  });

  it('should display the provided email in template', () => {
    const emailEl = fixture.nativeElement.querySelector('.org-email-banner__email');
    expect(emailEl).toBeTruthy();
    expect(emailEl.textContent?.trim()).toBe('organizer@example.com');
  });

  it('should enable resend button and display "Reenviar Confirmação" when cooldown is 0', () => {
    fixture.componentRef.setInput('resendCooldown', 0);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.org-email-banner__button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.disabled).toBe(false);
    expect(button.textContent).toContain('Reenviar Confirmação');
  });

  it('should disable resend button and display remaining seconds when cooldown > 0', () => {
    fixture.componentRef.setInput('resendCooldown', 45);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.org-email-banner__button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Reenviar em 45s');
  });

  it('should reactively update cooldown display when input changes', () => {
    fixture.componentRef.setInput('resendCooldown', 60);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.org-email-banner__button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Reenviar em 60s');

    fixture.componentRef.setInput('resendCooldown', 0);
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
    expect(button.textContent).toContain('Reenviar Confirmação');
  });

  it('should emit resend output when button is clicked and cooldown is 0', () => {
    let emitted = false;
    component.resend.subscribe(() => {
      emitted = true;
    });

    fixture.componentRef.setInput('resendCooldown', 0);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.org-email-banner__button') as HTMLButtonElement;
    button.click();

    expect(emitted).toBe(true);
  });

  it('should not emit resend output when onResend is invoked during cooldown', () => {
    let emitted = false;
    component.resend.subscribe(() => {
      emitted = true;
    });

    fixture.componentRef.setInput('resendCooldown', 30);
    fixture.detectChanges();

    component.onResend();

    expect(emitted).toBe(false);
  });
});
