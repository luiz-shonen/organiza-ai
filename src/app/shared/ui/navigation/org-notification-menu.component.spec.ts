import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { OrgNotificationMenuComponent } from './org-notification-menu.component';

async function openMenu(footer: unknown) {
  await TestBed.configureTestingModule({
    imports: [OrgNotificationMenuComponent],
  }).compileComponents();
  const fixture = TestBed.createComponent(OrgNotificationMenuComponent);
  fixture.componentRef.setInput('footer', footer);
  fixture.detectChanges();
  (
    fixture.nativeElement.querySelector('[data-testid="notifications-btn"]') as HTMLElement
  )?.click();
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('OrgNotificationMenuComponent footer', () => {
  it('shows the footer line under the list and tells when it is tapped', async () => {
    const fixture = await openMenu({
      icon: 'notifications_active',
      title: 'Ativar notificações no celular',
      body: 'Receba os avisos mesmo com o app fechado.',
    });
    const tapped = vi.fn();
    fixture.componentInstance.footerSelected.subscribe(tapped);
    const footer = document.querySelector<HTMLButtonElement>(
      '[data-testid="notifications-footer"]',
    );
    expect(footer?.textContent).toContain('Ativar notificações no celular');
    expect(footer?.disabled).toBe(false);
    footer?.click();
    expect(tapped).toHaveBeenCalled();
  });

  it('keeps an informative line disabled, and shows none without a footer', async () => {
    await openMenu({
      icon: 'notifications',
      title: 'Notificações bloqueadas',
      body: 'Libere nas configurações do navegador.',
      disabled: true,
    });
    const footer = document.querySelector<HTMLButtonElement>(
      '[data-testid="notifications-footer"]',
    );
    expect(footer?.disabled).toBe(true);
  });
});
