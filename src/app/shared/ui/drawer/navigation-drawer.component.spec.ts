import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationDrawerComponent } from './navigation-drawer.component';

describe('NavigationDrawerComponent', () => {
  let component: NavigationDrawerComponent;
  let fixture: ComponentFixture<NavigationDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationDrawerComponent],
      providers: [provideNoopAnimations()],
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

  it('emits a route request then asks its host to close the drawer', () => {
    const navigate = vi.fn();
    const close = vi.fn();
    component.navigate.subscribe(navigate);
    component.close.subscribe(close);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="drawer-my-events"]')
      ?.click();

    expect(navigate).toHaveBeenCalledWith('/meus-eventos');
    expect(close).toHaveBeenCalledOnce();
  });

  it('emits /design-system route request and closes drawer when design system button is clicked', () => {
    const navigate = vi.fn();
    const close = vi.fn();
    component.navigate.subscribe(navigate);
    component.close.subscribe(close);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="drawer-design-system"]')
      ?.click();

    expect(navigate).toHaveBeenCalledWith('/design-system');
    expect(close).toHaveBeenCalledOnce();
  });

  it('emits the selected theme mode and exposes its pressed state', () => {
    const themeChange = vi.fn();
    component.themeChange.subscribe(themeChange);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="drawer-theme-dark"]')
      ?.click();
    fixture.componentRef.setInput('themeMode', 'dark');
    fixture.detectChanges();

    expect(themeChange).toHaveBeenCalledWith('dark');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-testid="drawer-theme-dark"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
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
