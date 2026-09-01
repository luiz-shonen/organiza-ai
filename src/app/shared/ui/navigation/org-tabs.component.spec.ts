import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { OrgTabItem, OrgTabsComponent } from './org-tabs.component';

const TABS: readonly OrgTabItem[] = [
  { id: 'summary', label: 'Resumo', content: 'Resumo do evento' },
  { id: 'guests', label: 'Convidados', content: 'Lista de convidados' },
];

describe('OrgTabsComponent', () => {
  it('renders typed tab items and exposes the selected-id model', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTabsComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTabsComponent> = TestBed.createComponent(OrgTabsComponent);
    fixture.componentRef.setInput('items', TABS);
    fixture.componentRef.setInput('selectedId', 'guests');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Resumo');
    expect(fixture.nativeElement.textContent).toContain('Convidados');
    expect(fixture.componentInstance.selectedId()).toBe('guests');
    expect(fixture.nativeElement.textContent).toContain('Lista de convidados');
  });

  it('emits a typed selection change and accepts gradient opt-out', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTabsComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTabsComponent> = TestBed.createComponent(OrgTabsComponent);
    const selectionChange = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(selectionChange);
    fixture.componentRef.setInput('items', TABS);
    fixture.componentRef.setInput('gradient', false);
    fixture.detectChanges();

    fixture.componentInstance.selectIndex(1);
    expect(fixture.componentInstance.selectedId()).toBe('guests');
    expect(selectionChange).toHaveBeenCalledWith('guests');
    expect(
      fixture.nativeElement
        .querySelector('mat-tab-group')
        ?.classList.contains('org-tabs--gradient'),
    ).toBe(false);
  });
});
