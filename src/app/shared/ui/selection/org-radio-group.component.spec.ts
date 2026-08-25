import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgRadioGroupComponent, OrgRadioOption } from './org-radio-group.component';

const OPTIONS: readonly OrgRadioOption[] = [
  { label: 'E-mail', value: 'email' },
  { label: 'WhatsApp', value: 'whatsapp', disabled: true },
];

describe('OrgRadioGroupComponent', () => {
  it('renders typed options and selected model', async () => {
    await TestBed.configureTestingModule({ imports: [OrgRadioGroupComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgRadioGroupComponent> = TestBed.createComponent(OrgRadioGroupComponent);
    fixture.componentRef.setInput('label', 'Canal de confirmação');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('value', 'email');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Canal de confirmação');
    expect(fixture.nativeElement.textContent).toContain('E-mail');
    expect(fixture.nativeElement.textContent).toContain('WhatsApp');
    expect(fixture.componentInstance.value()).toBe('email');
  });

  it('has an explicit empty state and honors disabled groups', async () => {
    await TestBed.configureTestingModule({ imports: [OrgRadioGroupComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgRadioGroupComponent> = TestBed.createComponent(OrgRadioGroupComponent);
    fixture.componentRef.setInput('label', 'Canal de confirmação');
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nenhuma opção disponível.');
    expect(fixture.nativeElement.querySelector('.org-radio-group')?.getAttribute('aria-disabled')).toBe('true');
  });
});
