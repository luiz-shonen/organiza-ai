import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewPartyItem } from '../../../../../core/models';
import { ItemFormComponent } from './item-form.component';

describe('ItemFormComponent', () => {
  let fixture: ComponentFixture<ItemFormComponent>;
  let component: ItemFormComponent;
  let added: ReturnType<typeof vi.fn<(item: NewPartyItem) => void>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemFormComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    fixture = TestBed.createComponent(ItemFormComponent);
    component = fixture.componentInstance;
    added = vi.fn<(item: NewPartyItem) => void>();
    component.submitted.subscribe(added);
    fixture.detectChanges();
  });

  it('adds an item with the tidied name and a whole quantity', () => {
    component['name'].set('  Pipoca   doce ');
    component['quantity'].set('3');
    component['submit']();

    expect(added).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Pipoca doce', quantity: 3, unit: 'un.' }),
    );
  });

  it('refuses markup in the name and shows why', () => {
    component['name'].set('<script>');
    component['submit']();
    fixture.detectChanges();

    expect(added).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Não use os caracteres < > { }');
  });

  it('blocks a quantity outside 1 to 999 or with decimals', () => {
    component['name'].set('Refrigerante');
    for (const quantity of ['0', '1000', '1.5']) {
      component['quantity'].set(quantity);
      fixture.detectChanges();
      component['submit']();
      expect(added).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain('Use um número inteiro de 1 a 999');
    }
  });

  it('asks for a unit from the list when the typed one matches none', () => {
    component['name'].set('Refrigerante');
    component['unit'].set(null);
    component['submit']();
    fixture.detectChanges();

    expect(added).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Escolha uma unidade da lista');
  });

  it('types the quantity as digits only, without the browser number spinner', () => {
    const input = fixture.nativeElement.querySelector(
      '[data-testid="item-qty-input"]',
    ) as HTMLInputElement;
    expect(input.type).toBe('text');
    expect(input.getAttribute('inputmode')).toBe('numeric');

    input.value = '1a2b3c4';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('123');
  });

  it('marks name, quantity and unit as required and says what is missing', () => {
    component['submit']();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(added).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Informe o nome do item');
    for (const id of ['item-name-input', 'item-qty-input']) {
      expect(element.querySelector(`[data-testid="${id}"]`)?.hasAttribute('required')).toBe(true);
    }
    const addButton = element.querySelector('[data-testid="add-item-btn"]') as HTMLButtonElement;
    expect(addButton.disabled).toBe(false);
  });

  it('loads an item to edit and keeps it after saving', () => {
    fixture.componentRef.setInput('item', {
      name: 'Canjica',
      quantity: 5,
      unit: 'panelas',
      fixedQuantity: true,
    });
    fixture.detectChanges();
    expect(component['name']()).toBe('Canjica');
    expect(component['unit']()).toBe('panelas');
    expect(component['fixed']()).toBe(true);

    component['quantity'].set('6');
    component['submit']();
    expect(added).toHaveBeenCalledWith({
      name: 'Canjica',
      quantity: 6,
      unit: 'panelas',
      fixedQuantity: true,
    });
    expect(component['name']()).toBe('Canjica');
  });
});
