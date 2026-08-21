import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgFormGridDirective } from './org-form-grid.directive';

@Component({
  imports: [OrgFormGridDirective],
  template: `
    <form id="default-grid" orgFormGrid></form>
    <div id="two-to-one-grid" [orgFormGrid]="'2fr 1fr'"></div>
    <div id="three-col-grid" [orgFormGrid]="'1fr 1fr 1fr'"></div>
    <div id="fallback-grid" [orgFormGrid]="''"></div>
    <div id="dynamic-grid" [orgFormGrid]="dynamicCols()"></div>
  `,
})
class FormGridTestHostComponent {
  public dynamicCols = signal<string>('2fr 1fr');
}

describe('OrgFormGridDirective', () => {
  let fixture: ComponentFixture<FormGridTestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormGridTestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormGridTestHostComponent);
    fixture.detectChanges();
  });

  it('applies .org-form-grid class and default 1fr 1fr column template', () => {
    const el = fixture.nativeElement.querySelector('#default-grid') as HTMLElement;
    expect(el.classList.contains('org-form-grid')).toBe(true);
    expect(el.style.getPropertyValue('--org-form-grid-cols')).toBe('1fr 1fr');
  });

  it('sets custom 2fr 1fr grid template', () => {
    const el = fixture.nativeElement.querySelector('#two-to-one-grid') as HTMLElement;
    expect(el.classList.contains('org-form-grid')).toBe(true);
    expect(el.style.getPropertyValue('--org-form-grid-cols')).toBe('2fr 1fr');
  });

  it('sets custom 1fr 1fr 1fr grid template', () => {
    const el = fixture.nativeElement.querySelector('#three-col-grid') as HTMLElement;
    expect(el.classList.contains('org-form-grid')).toBe(true);
    expect(el.style.getPropertyValue('--org-form-grid-cols')).toBe('1fr 1fr 1fr');
  });

  it('falls back to 1fr 1fr when empty string is provided', () => {
    const el = fixture.nativeElement.querySelector('#fallback-grid') as HTMLElement;
    expect(el.classList.contains('org-form-grid')).toBe(true);
    expect(el.style.getPropertyValue('--org-form-grid-cols')).toBe('1fr 1fr');
  });

  it('updates columns dynamically when signal input changes', () => {
    const el = fixture.nativeElement.querySelector('#dynamic-grid') as HTMLElement;
    expect(el.style.getPropertyValue('--org-form-grid-cols')).toBe('2fr 1fr');

    fixture.componentInstance.dynamicCols.set('1fr 2fr 1fr');
    fixture.detectChanges();

    expect(el.style.getPropertyValue('--org-form-grid-cols')).toBe('1fr 2fr 1fr');
  });
});
