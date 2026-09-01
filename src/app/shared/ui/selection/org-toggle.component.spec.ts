import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgToggleComponent } from './org-toggle.component';

describe('OrgToggleComponent', () => {
  it('renders an accessible Material toggle and updates its checked model', async () => {
    await TestBed.configureTestingModule({ imports: [OrgToggleComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgToggleComponent> =
      TestBed.createComponent(OrgToggleComponent);
    fixture.componentRef.setInput('label', 'Notificações do evento');
    fixture.componentRef.setInput('checked', true);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector(
      'button[role="switch"]',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Notificações do evento');
  });

  it('does not change its model while disabled', async () => {
    await TestBed.configureTestingModule({ imports: [OrgToggleComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgToggleComponent> =
      TestBed.createComponent(OrgToggleComponent);
    fixture.componentRef.setInput('label', 'Notificações do evento');
    fixture.componentRef.setInput('checked', false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector(
      'button[role="switch"]',
    ) as HTMLButtonElement;
    toggle.click();
    expect(fixture.componentInstance.checked()).toBe(false);
    expect(toggle.disabled).toBe(true);
  });
});
