import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { OrgNavBarComponent, type OrgNavBarItem } from './org-nav-bar.component';

const ITEMS: readonly OrgNavBarItem[] = [
  { route: '/', label: 'Início', icon: 'home', testId: 'nav-home', exact: true },
  { route: '/meus-eventos', label: 'Meus eventos', icon: 'calendar_month', testId: 'nav-events' },
];

async function render(activeRoute: string, layout: 'bottom' | 'header' = 'bottom') {
  await TestBed.configureTestingModule({
    imports: [OrgNavBarComponent],
    providers: [provideRouter([])],
  }).compileComponents();
  const fixture = TestBed.createComponent(OrgNavBarComponent);
  fixture.componentRef.setInput('items', ITEMS);
  fixture.componentRef.setInput('activeRoute', activeRoute);
  fixture.componentRef.setInput('layout', layout);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('OrgNavBarComponent', () => {
  it('renders one link per item and marks only the active one', async () => {
    const element = await render('/meus-eventos/evento/novo');
    const links = Array.from(element.querySelectorAll('a'));

    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/meus-eventos']);
    expect(links[0].getAttribute('aria-current')).toBeNull();
    expect(links[1].getAttribute('aria-current')).toBe('page');
  });

  it('matches exact items only on their own route', async () => {
    const element = await render('/?filtro=confirmados');
    const home = element.querySelector('[data-testid="nav-home"]');
    expect(home?.getAttribute('aria-current')).toBe('page');
  });

  it('shows icons in the bottom bar and labels only in the header', async () => {
    const bottom = await render('/', 'bottom');
    expect(bottom.querySelectorAll('org-icon').length).toBe(2);
    TestBed.resetTestingModule();

    const header = await render('/', 'header');
    expect(header.querySelectorAll('org-icon').length).toBe(0);
    expect(header.querySelector('nav')?.getAttribute('aria-label')).toBe('Navegação principal');
  });
});
