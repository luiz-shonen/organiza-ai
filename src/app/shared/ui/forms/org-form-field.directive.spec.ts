import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { describe, expect, it } from 'vitest';
import { OrgFormFieldDirective } from './org-form-field.directive';

@Component({
  imports: [MatFormFieldModule, MatInputModule, OrgFormFieldDirective],
  template: `
    <mat-form-field appearance="outline" orgFormField>
      <mat-label>Nome</mat-label>
      <input matInput />
    </mat-form-field>
  `,
})
class FormFieldHostComponent {}

describe('OrgFormFieldDirective', () => {
  it('applies one coherent MDC token recipe to a native outlined Material field', async () => {
    await TestBed.configureTestingModule({ imports: [FormFieldHostComponent] }).compileComponents();
    const fixture: ComponentFixture<FormFieldHostComponent> = TestBed.createComponent(FormFieldHostComponent);
    fixture.detectChanges();

    const field = fixture.nativeElement.querySelector('mat-form-field') as HTMLElement;
    expect(field.classList.contains('org-form-field')).toBe(true);
    expect(field.style.getPropertyValue('--mdc-outlined-text-field-focus-outline-color')).toBe('var(--org-primary)');
    expect(field.style.getPropertyValue('--mdc-outlined-text-field-hover-outline-color')).toBe('var(--org-primary)');
    expect(field.style.getPropertyValue('--mdc-outlined-text-field-error-outline-color')).toBe('var(--org-error)');
    expect(field.style.getPropertyValue('--mdc-outlined-text-field-container-color')).toBe('var(--org-field-fill)');
  });
});
