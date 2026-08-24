import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgDateFieldComponent } from './org-date-field.component';

describe('OrgDateFieldComponent', () => {
  it('renders the shared outlined date field contract', async () => {
    await TestBed.configureTestingModule({ imports: [OrgDateFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgDateFieldComponent> = TestBed.createComponent(OrgDateFieldComponent);
    fixture.componentRef.setInput('label', 'Data da celebração');
    fixture.detectChanges();

    const field = fixture.nativeElement.querySelector('mat-form-field') as HTMLElement;

    expect(field.getAttribute('appearance')).toBe('outline');
    expect(field.textContent).toContain('Data da celebração');
    expect(fixture.nativeElement.querySelector('mat-datepicker-toggle')).toBeTruthy();
  });
});
