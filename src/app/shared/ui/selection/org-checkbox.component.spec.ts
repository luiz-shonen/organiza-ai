import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgCheckboxComponent } from './org-checkbox.component';

describe('OrgCheckboxComponent', () => {
  it('renders label plus checked and indeterminate states', async () => {
    await TestBed.configureTestingModule({ imports: [OrgCheckboxComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgCheckboxComponent> =
      TestBed.createComponent(OrgCheckboxComponent);
    fixture.componentRef.setInput('label', 'Aceito receber novidades');
    fixture.componentRef.setInput('checked', true);
    fixture.componentRef.setInput('indeterminate', true);
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(checkbox.indeterminate).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Aceito receber novidades');
  });

  it('does not change while disabled', async () => {
    await TestBed.configureTestingModule({ imports: [OrgCheckboxComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgCheckboxComponent> =
      TestBed.createComponent(OrgCheckboxComponent);
    fixture.componentRef.setInput('label', 'Aceito receber novidades');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(checkbox.disabled).toBe(true);
    expect(fixture.componentInstance.checked()).toBe(false);
  });
});
