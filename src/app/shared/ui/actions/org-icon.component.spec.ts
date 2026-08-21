import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ORG_ICON_MAP, OrgIconComponent } from './org-icon.component';

@Component({
  imports: [OrgIconComponent],
  template: '<org-icon name="check_circle" size="lg" />',
})
class IconHostComponent {}

describe('OrgIconComponent', () => {
  it('renders the documented semantic Material icon through its tokenized decorative contract', async () => {
    await TestBed.configureTestingModule({ imports: [IconHostComponent] }).compileComponents();
    const fixture: ComponentFixture<IconHostComponent> = TestBed.createComponent(IconHostComponent);
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('mat-icon') as HTMLElement;
    expect(icon.textContent?.trim()).toBe(ORG_ICON_MAP.check_circle);
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.classList.contains('org-icon--lg')).toBe(true);
    expect(icon.style.getPropertyValue('--org-icon-size')).toBe('1.5rem');
    expect(icon.style.getPropertyValue('--org-icon-color')).toBe('var(--org-on-surface-variant)');
  });
});
