import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it } from 'vitest';
import { NavigationDrawerLinkComponent } from './navigation-drawer-link.component';

describe('NavigationDrawerLinkComponent', () => {
  it('renders a full-width semantic link with active route state', async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationDrawerLinkComponent],
      providers: [provideNoopAnimations(), provideRouter([])],
    }).compileComponents();

    const fixture: ComponentFixture<NavigationDrawerLinkComponent> = TestBed.createComponent(NavigationDrawerLinkComponent);
    fixture.componentRef.setInput('route', '/meus-eventos');
    fixture.componentRef.setInput('icon', 'calendar_month');
    fixture.componentRef.setInput('label', 'Meus eventos');
    fixture.componentRef.setInput('testId', 'drawer-my-events');
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '[data-testid="drawer-my-events"]',
    );
    expect(link?.tagName).toBe('A');
    expect(link?.getAttribute('href')).toBe('/meus-eventos');
    expect(link?.getAttribute('aria-current')).toBe('page');
    expect(link?.classList.contains('navigation-drawer-link--active')).toBe(true);
  });
});
