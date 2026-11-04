import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgThemeToggleComponent } from './org-theme-toggle.component';

describe('OrgThemeToggleComponent', () => {
  it('marks the theme in use and switches on click', async () => {
    await TestBed.configureTestingModule({
      imports: [OrgThemeToggleComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrgThemeToggleComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const light = element.querySelector('[data-testid="theme-light-btn"]') as HTMLButtonElement;
    const dark = element.querySelector('[data-testid="theme-dark-btn"]') as HTMLButtonElement;

    expect(light.getAttribute('aria-pressed')).toBe('true');
    expect(dark.getAttribute('aria-pressed')).toBe('false');

    dark.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.dark()).toBe(true);
    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('.org-theme-toggle--dark')).not.toBeNull();
  });
});
