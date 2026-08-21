import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgFieldLabelDirective } from './org-field-label.directive';

@Component({
  imports: [OrgFieldLabelDirective],
  template: `
    <label [orgFieldLabel]="'guest-name'">Nome do convidado</label>
    <input id="guest-name" />
  `,
})
class FieldLabelHostComponent {}

describe('OrgFieldLabelDirective', () => {
  it('associates an external semantic label with its native field without adding decorative label treatment', async () => {
    await TestBed.configureTestingModule({ imports: [FieldLabelHostComponent] }).compileComponents();
    const fixture: ComponentFixture<FieldLabelHostComponent> = TestBed.createComponent(FieldLabelHostComponent);
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe('guest-name');
    expect(label.classList.contains('org-field-label')).toBe(true);
    expect(label.style.getPropertyValue('background')).toBe('');
  });
});
