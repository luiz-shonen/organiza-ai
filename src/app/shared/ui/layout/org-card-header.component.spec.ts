import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrgCardHeaderComponent } from './org-card-header.component';

describe('OrgCardHeaderComponent', () => {
  let fixture: ComponentFixture<OrgCardHeaderComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrgCardHeaderComponent);
    fixture.componentRef.setInput('icon', 'pix');
    fixture.componentRef.setInput('heading', 'Rachadinha via Pix');
    fixture.detectChanges();
  });

  it('renders the heading as a level-two heading', () => {
    const heading = fixture.nativeElement.querySelector('h2') as HTMLElement;
    expect(heading.textContent?.trim()).toBe('Rachadinha via Pix');
  });

  it('renders the subheading only when provided', () => {
    expect(fixture.nativeElement.querySelector('p')).toBeNull();
    fixture.componentRef.setInput('subheading', 'Contribua com o evento!');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('p')?.textContent).toContain('Contribua');
  });

  it('applies the requested tone to the icon badge', () => {
    fixture.componentRef.setInput('tone', 'success');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.org-card-header__badge') as HTMLElement;
    expect(badge.classList.contains('org-card-header__badge--success')).toBe(true);
  });
});
