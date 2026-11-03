import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
import { CompanionRosterComponent } from './companion-roster.component';

interface RosterInternals {
  newName: { set: (value: string) => void };
  submitAdd: () => void;
  addError: () => string;
  startEdit: (name: string) => void;
  editName: { set: (value: string) => void };
  saveEdit: () => void;
  onRemove: (name: string) => void;
}

async function render(names: string[]) {
  await TestBed.configureTestingModule({
    imports: [CompanionRosterComponent],
    providers: [provideNoopAnimations()],
  }).compileComponents();
  const fixture = TestBed.createComponent(CompanionRosterComponent);
  fixture.componentRef.setInput('names', names);
  fixture.detectChanges();
  return { fixture, roster: fixture.componentInstance as unknown as RosterInternals };
}

describe('CompanionRosterComponent', () => {
  it('lists the companions and adds a new one, refusing a repeated name', async () => {
    const { fixture, roster } = await render(['Ana']);
    const add = vi.fn();
    fixture.componentInstance.add.subscribe(add);

    expect(fixture.nativeElement.textContent).toContain('Ana');

    roster.newName.set('ANA');
    roster.submitAdd();
    expect(add).not.toHaveBeenCalled();
    expect(roster.addError()).toBe('Essa pessoa já está na lista');

    roster.newName.set('  Carlos ');
    roster.submitAdd();
    expect(add).toHaveBeenCalledWith('Carlos');
  });

  it('renames in the sheet and removes from the list', async () => {
    const { fixture, roster } = await render(['Ana', 'Bruno']);
    const rename = vi.fn();
    const remove = vi.fn();
    fixture.componentInstance.rename.subscribe(rename);
    fixture.componentInstance.remove.subscribe(remove);

    roster.startEdit('Ana');
    roster.editName.set('Ana Paula');
    roster.saveEdit();
    expect(rename).toHaveBeenCalledWith({ from: 'Ana', to: 'Ana Paula' });

    roster.onRemove('Bruno');
    expect(remove).toHaveBeenCalledWith('Bruno');
  });
});
