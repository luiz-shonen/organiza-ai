import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgTimeFieldComponent } from './org-time-field.component';

describe('OrgTimeFieldComponent', () => {
  it('renders a shared native time field with the standard field geometry and propagates its value', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTimeFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTimeFieldComponent> = TestBed.createComponent(OrgTimeFieldComponent);
    fixture.componentRef.setInput('label', 'Horário de início');
    fixture.componentRef.setInput('value', '19:30');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="time"]') as HTMLInputElement;
    const field = fixture.nativeElement.querySelector('mat-form-field') as HTMLElement;
    input.value = '20:00';
    input.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.value()).toBe('20:00');
    expect(field.classList.contains('org-time-field')).toBe(true);
  });
});
