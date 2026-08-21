import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgPageLayoutComponent, OrgPageLayoutMaxWidth } from './org-page-layout.component';

@Component({
  imports: [OrgPageLayoutComponent],
  template: `
    <org-page-layout id="default-layout">
      <div id="projected-content">Hello World</div>
    </org-page-layout>
    <org-page-layout id="narrow-layout" maxWidth="narrow"></org-page-layout>
    <org-page-layout id="wide-layout" maxWidth="wide"></org-page-layout>
    <org-page-layout id="full-layout" maxWidth="full"></org-page-layout>
    <org-page-layout id="fallback-layout" [maxWidth]="invalidMaxWidth"></org-page-layout>
    <org-page-layout id="dynamic-layout" [maxWidth]="dynamicMaxWidth()"></org-page-layout>
  `,
})
class PageLayoutTestHostComponent {
  public invalidMaxWidth: string = 'invalid-size';
  public dynamicMaxWidth = signal<OrgPageLayoutMaxWidth>('narrow');
}

describe('OrgPageLayoutComponent', () => {
  let fixture: ComponentFixture<PageLayoutTestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageLayoutTestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageLayoutTestHostComponent);
    fixture.detectChanges();
  });

  it('sets role="main" and default layout classes on host', () => {
    const el = fixture.nativeElement.querySelector('#default-layout') as HTMLElement;
    expect(el.getAttribute('role')).toBe('main');
    expect(el.classList.contains('org-page-layout')).toBe(true);
    expect(el.classList.contains('org-page-layout--default')).toBe(true);
  });

  it('projects content into the container', () => {
    const defaultLayout = fixture.nativeElement.querySelector('#default-layout') as HTMLElement;
    const projected = defaultLayout.querySelector('.org-page-layout__container #projected-content') as HTMLElement;
    expect(projected).toBeTruthy();
    expect(projected.textContent).toBe('Hello World');
  });

  it('applies narrow maxWidth class', () => {
    const el = fixture.nativeElement.querySelector('#narrow-layout') as HTMLElement;
    expect(el.classList.contains('org-page-layout--narrow')).toBe(true);
    expect(el.classList.contains('org-page-layout--default')).toBe(false);
  });

  it('applies wide maxWidth class', () => {
    const el = fixture.nativeElement.querySelector('#wide-layout') as HTMLElement;
    expect(el.classList.contains('org-page-layout--wide')).toBe(true);
    expect(el.classList.contains('org-page-layout--default')).toBe(false);
  });

  it('applies full maxWidth class', () => {
    const el = fixture.nativeElement.querySelector('#full-layout') as HTMLElement;
    expect(el.classList.contains('org-page-layout--full')).toBe(true);
    expect(el.classList.contains('org-page-layout--default')).toBe(false);
  });

  it('falls back to default maxWidth when invalid value is provided', () => {
    const el = fixture.nativeElement.querySelector('#fallback-layout') as HTMLElement;
    expect(el.classList.contains('org-page-layout--default')).toBe(true);
  });

  it('updates maxWidth dynamically with signal change', () => {
    const el = fixture.nativeElement.querySelector('#dynamic-layout') as HTMLElement;
    expect(el.classList.contains('org-page-layout--narrow')).toBe(true);

    fixture.componentInstance.dynamicMaxWidth.set('wide');
    fixture.detectChanges();

    expect(el.classList.contains('org-page-layout--wide')).toBe(true);
    expect(el.classList.contains('org-page-layout--narrow')).toBe(false);
  });
});
