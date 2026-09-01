import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { OrgTextFieldComponent } from './org-text-field.component';

describe('OrgTextFieldComponent', () => {
  it('binds label, value and the default text type', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTextFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTextFieldComponent> =
      TestBed.createComponent(OrgTextFieldComponent);
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
    const fixture: ComponentFixture<OrgTextFieldComponent> =
      TestBed.createComponent(OrgTextFieldComponent);
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

  it('provides a closed password visibility action', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTextFieldComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgTextFieldComponent);
    fixture.componentRef.setInput('label', 'Senha');
    fixture.componentRef.setInput('type', 'password');
    const toggle = vi.fn();
    fixture.componentInstance.togglePasswordVisibility.subscribe(toggle);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(input.type).toBe('password');
    button.click();
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('keeps readonly limits and field icons inside the closed API', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTextFieldComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgTextFieldComponent);
    fixture.componentRef.setInput('label', 'Quantidade');
    fixture.componentRef.setInput('type', 'number');
    fixture.componentRef.setInput('min', 1);
    fixture.componentRef.setInput('max', 12);
    fixture.componentRef.setInput('readOnly', true);
    fixture.componentRef.setInput('prefixIcon', 'inventory_2');
    fixture.componentRef.setInput('suffixIcon', 'lock');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(fixture.componentInstance.readOnly()).toBe(true);
    expect(input.readOnly).toBe(true);
    expect(input.min).toBe('1');
    expect(input.max).toBe('12');
    expect(fixture.nativeElement.textContent).toContain('inventory_2');
    expect(fixture.nativeElement.textContent).toContain('lock');
  });
});
