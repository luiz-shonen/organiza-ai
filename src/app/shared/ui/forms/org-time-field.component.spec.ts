import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgTimeFieldComponent } from './org-time-field.component';

describe('OrgTimeFieldComponent', () => {
  it('renders a custom Material-integrated time editor instead of a native time input', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTimeFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTimeFieldComponent> = TestBed.createComponent(OrgTimeFieldComponent);
    fixture.componentRef.setInput('label', 'Horário de início');
    fixture.componentRef.setInput('value', '19:30');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[inputmode="numeric"]') as HTMLInputElement;
    const field = fixture.nativeElement.querySelector('mat-form-field') as HTMLElement;
    input.value = '2000';
    input.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.value()).toBe('20:00');
    expect(field.classList.contains('org-time-field')).toBe(true);
    expect(fixture.nativeElement.querySelector('input[type="time"]')).toBeNull();
  });

  it('increments time using a configurable minute step without leaving HH:mm', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTimeFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTimeFieldComponent> = TestBed.createComponent(OrgTimeFieldComponent);
    fixture.componentRef.setInput('value', '19:30');
    fixture.componentRef.setInput('minuteStep', 15);
    fixture.detectChanges();

    const increment = fixture.nativeElement.querySelector('[aria-label="Avançar horário"]') as HTMLButtonElement;
    increment.click();

    expect(fixture.componentInstance.value()).toBe('19:45');
  });
});
