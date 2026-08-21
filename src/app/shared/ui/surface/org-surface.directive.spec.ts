import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgSurfaceDirective, OrgSurfaceVariant } from './org-surface.directive';

@Component({
  imports: [OrgSurfaceDirective],
  template: `
    <div id="default-surface" orgSurface></div>
    <div id="card-surface" [orgSurface]="'card'"></div>
    <div id="panel-surface" [orgSurface]="'panel'"></div>
    <div id="hero-surface" [orgSurface]="'hero'"></div>
    <div id="drawer-surface" [orgSurface]="'drawer'"></div>
    <div id="dialog-surface" [orgSurface]="'dialog'"></div>
    <div id="fallback-surface" [orgSurface]="invalidVariant"></div>
    <div id="dynamic-surface" [orgSurface]="dynamicVariant()"></div>
  `,
})
class SurfaceTestHostComponent {
  public invalidVariant: string = 'unsupported-variant';
  public dynamicVariant = signal<OrgSurfaceVariant>('panel');
}

describe('OrgSurfaceDirective', () => {
  let fixture: ComponentFixture<SurfaceTestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurfaceTestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SurfaceTestHostComponent);
    fixture.detectChanges();
  });

  it('applies default card surface variant and base class', () => {
    const el = fixture.nativeElement.querySelector('#default-surface') as HTMLElement;
    expect(el.classList.contains('org-surface')).toBe(true);
    expect(el.classList.contains('org-surface--card')).toBe(true);
  });

  it('applies explicit card variant', () => {
    const el = fixture.nativeElement.querySelector('#card-surface') as HTMLElement;
    expect(el.classList.contains('org-surface')).toBe(true);
    expect(el.classList.contains('org-surface--card')).toBe(true);
  });

  it('applies panel surface variant', () => {
    const el = fixture.nativeElement.querySelector('#panel-surface') as HTMLElement;
    expect(el.classList.contains('org-surface')).toBe(true);
    expect(el.classList.contains('org-surface--panel')).toBe(true);
    expect(el.classList.contains('org-surface--card')).toBe(false);
  });

  it('applies hero surface variant', () => {
    const el = fixture.nativeElement.querySelector('#hero-surface') as HTMLElement;
    expect(el.classList.contains('org-surface')).toBe(true);
    expect(el.classList.contains('org-surface--hero')).toBe(true);
    expect(el.classList.contains('org-surface--card')).toBe(false);
  });

  it('applies drawer surface variant', () => {
    const el = fixture.nativeElement.querySelector('#drawer-surface') as HTMLElement;
    expect(el.classList.contains('org-surface')).toBe(true);
    expect(el.classList.contains('org-surface--drawer')).toBe(true);
    expect(el.classList.contains('org-surface--card')).toBe(false);
  });

  it('applies dialog surface variant', () => {
    const el = fixture.nativeElement.querySelector('#dialog-surface') as HTMLElement;
    expect(el.classList.contains('org-surface')).toBe(true);
    expect(el.classList.contains('org-surface--dialog')).toBe(true);
    expect(el.classList.contains('org-surface--card')).toBe(false);
  });

  it('falls back to card variant when an invalid variant is passed', () => {
    const el = fixture.nativeElement.querySelector('#fallback-surface') as HTMLElement;
    expect(el.classList.contains('org-surface')).toBe(true);
    expect(el.classList.contains('org-surface--card')).toBe(true);
  });

  it('updates classes dynamically when signal input changes', () => {
    const el = fixture.nativeElement.querySelector('#dynamic-surface') as HTMLElement;
    expect(el.classList.contains('org-surface--panel')).toBe(true);

    fixture.componentInstance.dynamicVariant.set('hero');
    fixture.detectChanges();

    expect(el.classList.contains('org-surface--hero')).toBe(true);
    expect(el.classList.contains('org-surface--panel')).toBe(false);
  });
});
