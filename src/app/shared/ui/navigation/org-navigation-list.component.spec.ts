import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { OrgNavigationItem, OrgNavigationListComponent } from './org-navigation-list.component';

const ITEMS: readonly OrgNavigationItem[] = [
  { id: 'home', label: 'Início', href: '/' },
  { id: 'events', label: 'Meus eventos', href: '/meus-eventos' },
];

describe('OrgNavigationListComponent', () => {
  it('renders accessible typed links and active state', async () => {
    await TestBed.configureTestingModule({
      imports: [OrgNavigationListComponent],
    }).compileComponents();
    const fixture: ComponentFixture<OrgNavigationListComponent> = TestBed.createComponent(
      OrgNavigationListComponent,
    );
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('activeId', 'events');
    fixture.detectChanges();

    const active = fixture.nativeElement.querySelector(
      '[aria-current="page"]',
    ) as HTMLAnchorElement;
    expect(active.textContent?.trim()).toBe('Meus eventos');
    expect(active.getAttribute('href')).toBe('/meus-eventos');
  });

  it('renders the empty state and emits selected ids', async () => {
    await TestBed.configureTestingModule({
      imports: [OrgNavigationListComponent],
    }).compileComponents();
    const fixture: ComponentFixture<OrgNavigationListComponent> = TestBed.createComponent(
      OrgNavigationListComponent,
    );
    const selected = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    fixture.componentInstance.select('events');
    expect(fixture.nativeElement.textContent).toContain('Nenhum item disponível.');
    expect(selected).toHaveBeenCalledWith('events');
  });

  it('renders action items as buttons when no route target is provided', async () => {
    await TestBed.configureTestingModule({
      imports: [OrgNavigationListComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrgNavigationListComponent);
    fixture.componentRef.setInput('items', [{ id: 'guests', label: 'Convidados confirmados' }]);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('button.org-navigation-list__item')?.textContent,
    ).toContain('Convidados confirmados');
    expect(fixture.nativeElement.querySelector('a.org-navigation-list__item')).toBeNull();
  });
});
