import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgTimeFieldComponent } from './org-time-field.component';

describe('OrgTimeFieldComponent', () => {
  it('renders a custom Material-integrated time editor instead of a native time input', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTimeFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTimeFieldComponent> =
      TestBed.createComponent(OrgTimeFieldComponent);
    fixture.componentRef.setInput('label', 'Horário de início');
    fixture.componentRef.setInput('value', '19:30');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[inputmode="numeric"]',
    ) as HTMLInputElement;
    const field = fixture.nativeElement.querySelector('mat-form-field') as HTMLElement;
    input.value = '2000';
    input.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.value()).toBe('20:00');
    expect(field.classList.contains('org-time-field')).toBe(true);
    expect(fixture.nativeElement.querySelector('input[type="time"]')).toBeNull();
  });

  it('increments time using a configurable minute step without leaving HH:mm', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTimeFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTimeFieldComponent> =
      TestBed.createComponent(OrgTimeFieldComponent);
    fixture.componentRef.setInput('value', '19:30');
    fixture.componentRef.setInput('minuteStep', 15);
    fixture.detectChanges();

    fixture.componentInstance.increment();

    expect(fixture.componentInstance.value()).toBe('19:45');
  });

  it('uses a single Material menu trigger and applies a typed quick-time option', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTimeFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTimeFieldComponent> =
      TestBed.createComponent(OrgTimeFieldComponent);
    fixture.componentRef.setInput('quickOptions', [
      { label: 'Início da festa, 19h', value: '19:00' },
    ]);
    fixture.detectChanges();

    fixture.componentInstance.selectQuickOption({ label: 'Início da festa, 19h', value: '19:00' });

    expect(fixture.componentInstance.value()).toBe('19:00');
    expect(fixture.nativeElement.querySelectorAll('.org-time-field__trigger')).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelectorAll(
        '[aria-label="Voltar horário"], [aria-label="Avançar horário"]',
      ),
    ).toHaveLength(0);
  });

  it('does not change the value outside configured minimum and maximum limits', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTimeFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTimeFieldComponent> =
      TestBed.createComponent(OrgTimeFieldComponent);
    fixture.componentRef.setInput('value', '19:30');
    fixture.componentRef.setInput('min', '19:00');
    fixture.componentRef.setInput('max', '20:00');
    fixture.detectChanges();

    fixture.componentInstance.selectQuickOption({ label: 'Muito cedo', value: '18:30' });
    fixture.componentInstance.selectQuickOption({ label: 'Horário válido', value: '20:00' });
    fixture.componentInstance.increment();

    expect(fixture.componentInstance.value()).toBe('20:00');
  });

  it('honors disabled state provided by Angular reactive forms', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTimeFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTimeFieldComponent> =
      TestBed.createComponent(OrgTimeFieldComponent);
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).disabled).toBe(true);
  });
});
