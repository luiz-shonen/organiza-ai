import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { describe, expect, it, vi } from 'vitest';
import { OrgAutocompleteFieldComponent } from './org-autocomplete-field.component';
import type { OrgSelectOption } from './org-select-field.component';

const OPTIONS: readonly OrgSelectOption[] = [
  { label: 'Cônjuge', value: 'spouse' },
  { label: 'Filho(a)', value: 'child' },
  { label: 'Pai/Mãe', value: 'parent' },
  { label: 'Irmão(ã)', value: 'sibling' },
  { label: 'Parente', value: 'relative' },
  { label: 'Outro', value: 'other', disabled: true },
];

describe('OrgAutocompleteFieldComponent', () => {
  async function createComponent(): Promise<ComponentFixture<OrgAutocompleteFieldComponent>> {
    await TestBed.configureTestingModule({
      imports: [OrgAutocompleteFieldComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrgAutocompleteFieldComponent);
    fixture.componentRef.setInput('label', 'Parentesco');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();
    return fixture;
  }

  it('filters typed option labels without case or diacritic sensitivity', async () => {
    const fixture = await createComponent();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'CONJUGE';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance['filteredOptions']().map((option) => option.value)).toEqual(['spouse']);
  });

  it('models the selected typed value and shows its label', async () => {
    const fixture = await createComponent();
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);

    fixture.componentInstance['selectOption']('sibling');
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('sibling');
    expect(onChange).toHaveBeenCalledWith('sibling');
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('Irmão(ã)');
  });

  it('clears the selected model and shows the empty state when the typed query has no match', async () => {
    const fixture = await createComponent();
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.writeValue('spouse');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'sem resultado';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.debugElement.query(By.css('input')).injector.get(MatAutocompleteTrigger).openPanel();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
    expect(fixture.componentInstance['filteredOptions']()).toEqual([]);
    expect(document.body.textContent).toContain('Nenhuma opção encontrada.');
  });

  it('does not select a disabled option', async () => {
    const fixture = await createComponent();
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);

    fixture.componentInstance['selectOption']('other');

    expect(fixture.componentInstance.value()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not update its selected value while disabled', async () => {
    const fixture = await createComponent();
    fixture.componentRef.setInput('disabled', true);
    fixture.componentInstance.writeValue('child');
    fixture.detectChanges();

    fixture.componentInstance['selectOption']('parent');

    expect(fixture.componentInstance.value()).toBe('child');
  });
});
