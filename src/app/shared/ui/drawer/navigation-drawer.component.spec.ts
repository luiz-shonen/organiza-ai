import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationDrawerComponent } from './navigation-drawer.component';

describe('NavigationDrawerComponent', () => {
  let component: NavigationDrawerComponent;
  let fixture: ComponentFixture<NavigationDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationDrawerComponent],
      providers: [provideNoopAnimations(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationDrawerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isAuthenticated', true);
    fixture.componentRef.setInput('isSuperAdmin', true);
    fixture.componentRef.setInput('displayName', 'Mariana');
    fixture.componentRef.setInput('email', 'mariana@exemplo.com');
    fixture.componentRef.setInput('activeRoute', '/perfil');
    fixture.detectChanges();
  });

  it('renders only authorized routes and identifies the active route', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="drawer-my-events"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="drawer-profile"]')?.getAttribute('aria-current')).toBe(
      'page',
    );
    expect(root.querySelector('[data-testid="drawer-admin"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="drawer-design-system"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="drawer-login"]')).toBeNull();
  });

  it('uses semantic links for authenticated navigation destinations', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '[data-testid="drawer-my-events"]',
    );

    expect(link?.tagName).toBe('A');
    expect(link?.getAttribute('href')).toBe('/meus-eventos');
  });

  it('uses a semantic link for the design system route', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '[data-testid="drawer-design-system"]',
    );

    expect(link?.tagName).toBe('A');
    expect(link?.getAttribute('href')).toBe('/design-system');
  });

  it('uses the same drawer component for design-system section navigation', () => {
    fixture.componentRef.setInput('isDesignSystemNavigation', true);
    fixture.componentRef.setInput('activeRoute', '/design-system#overview');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const overview = root.querySelector<HTMLAnchorElement>(
      '[data-testid="drawer-design-system-overview"]',
    );

    expect(overview?.getAttribute('href')).toBe('/design-system#overview');
    expect(overview?.getAttribute('aria-current')).toBe('location');
    expect(root.textContent).toContain('Marca');
    expect(root.textContent).toContain('Fundações');
    expect(root.textContent).toContain('Produto');
    expect(root.querySelector('[data-testid="drawer-design-system-colors"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="drawer-design-system-tokens"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="drawer-design-system-typography"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="drawer-design-system-stepper"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="drawer-my-events"]')).toBeNull();
  });

  it('uses links for theme choices and exposes their selected state', () => {
    const themeChange = vi.fn();
    component.themeChange.subscribe(themeChange);

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '[data-testid="drawer-theme-dark"]',
    );
    fixture.componentRef.setInput('themeMode', 'dark');
    fixture.detectChanges();

    expect(link?.tagName).toBe('A');
    expect(link?.getAttribute('href')).toBe('/perfil');
    expect(link?.getAttribute('aria-current')).toBe('true');
    (component as unknown as { onThemeChange: (mode: 'dark') => void }).onThemeChange('dark');
    expect(themeChange).toHaveBeenCalledWith('dark');
  });

  it('offers logout only to authenticated users and emits it without a domain service', () => {
    const logout = vi.fn();
    component.logout.subscribe(logout);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="drawer-logout"]')
      ?.click();

    expect(logout).toHaveBeenCalledOnce();
  });

  it('provides a labelled close control with a 48px touch target', () => {
    const closeButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="navigation-drawer-close"]',
    );

    expect(closeButton?.getAttribute('aria-label')).toBe('Fechar menu de navegação');
    expect(closeButton?.classList.contains('navigation-drawer__close')).toBe(true);
  });
});
