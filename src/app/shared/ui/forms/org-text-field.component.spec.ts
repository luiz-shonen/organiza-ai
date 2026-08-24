import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgTextFieldComponent } from './org-text-field.component';

describe('OrgTextFieldComponent', () => {
  it('binds label, value and the default text type', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTextFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTextFieldComponent> = TestBed.createComponent(OrgTextFieldComponent);
    fixture.componentRef.setInput('label', 'Título do evento');
    fixture.componentRef.setInput('value', 'Ceia de Natal');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('text');
    expect(input.value).toBe('Ceia de Natal');
    expect(fixture.nativeElement.textContent).toContain('Título do evento');
  });

  it('models input and shows error semantics without accepting changes while disabled', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTextFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTextFieldComponent> = TestBed.createComponent(OrgTextFieldComponent);
    fixture.componentRef.setInput('label', 'E-mail');
    fixture.componentRef.setInput('error', 'Informe um e-mail válido.');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'novo@exemplo.com';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.disabled).toBe(true);
    expect(fixture.componentInstance.value()).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Informe um e-mail válido.');
  });
});
