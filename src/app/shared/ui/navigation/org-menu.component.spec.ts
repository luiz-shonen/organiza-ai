import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { OrgMenuAction, OrgMenuComponent } from './org-menu.component';

const ACTIONS: readonly OrgMenuAction[] = [
  { id: 'duplicate', label: 'Duplicar evento' },
  { id: 'archive', label: 'Arquivar rascunho', disabled: true },
];

describe('OrgMenuComponent', () => {
  it('renders a labelled trigger and typed actions', async () => {
    await TestBed.configureTestingModule({ imports: [OrgMenuComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgMenuComponent> = TestBed.createComponent(OrgMenuComponent);
    fixture.componentRef.setInput('triggerLabel', 'Mais ações');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mais ações');
    expect(fixture.nativeElement.querySelector('button')?.getAttribute('aria-haspopup')).toBe(
      'menu',
    );
  });

  it('has an explicit empty state and emits selected actions', async () => {
    await TestBed.configureTestingModule({ imports: [OrgMenuComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgMenuComponent> = TestBed.createComponent(OrgMenuComponent);
    const actionSelected = vi.fn();
    fixture.componentInstance.actionSelected.subscribe(actionSelected);
    fixture.componentRef.setInput('triggerLabel', 'Mais ações');
    fixture.componentRef.setInput('actions', []);
    fixture.detectChanges();

    fixture.componentInstance.select({ id: 'duplicate', label: 'Duplicar evento' });
    expect(actionSelected).toHaveBeenCalledWith('duplicate');
    expect(fixture.nativeElement.textContent).toContain('Mais ações');
  });
});
