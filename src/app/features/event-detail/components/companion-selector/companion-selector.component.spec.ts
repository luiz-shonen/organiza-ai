import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
import { CompanionSelectorComponent } from './companion-selector.component';

async function render(names: string[], selected: string[]) {
  await TestBed.configureTestingModule({
    imports: [CompanionSelectorComponent],
    providers: [provideNoopAnimations()],
  }).compileComponents();
  const fixture = TestBed.createComponent(CompanionSelectorComponent);
  fixture.componentRef.setInput('names', names);
  fixture.componentRef.setInput('selected', selected);
  fixture.detectChanges();
  return fixture;
}

describe('CompanionSelectorComponent', () => {
  it('adds a new name, refusing one already on the list', async () => {
    const fixture = await render(['Ana'], []);
    const add = vi.fn();
    fixture.componentInstance.add.subscribe(add);
    const component = fixture.componentInstance as unknown as {
      newName: { set: (value: string) => void };
      submitNew: () => void;
      nameError: () => string;
    };

    component.newName.set('ana');
    component.submitNew();
    expect(add).not.toHaveBeenCalled();
    expect(component.nameError()).toBe('Essa pessoa já está na lista');

    component.newName.set('  Carla  ');
    component.submitNew();
    expect(add).toHaveBeenCalledWith('Carla');
  });

  it('stops at ten companions', async () => {
    const ten = Array.from({ length: 10 }, (_, i) => 'Pessoa ' + String.fromCharCode(65 + i));
    const fixture = await render([...ten, 'Extra'], ten);
    const toggle = vi.fn();
    fixture.componentInstance.toggleCompanion.subscribe(toggle);

    (fixture.componentInstance as unknown as { onToggle: (name: string) => void }).onToggle(
      'Extra',
    );

    expect(toggle).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('+10');
  });
});
