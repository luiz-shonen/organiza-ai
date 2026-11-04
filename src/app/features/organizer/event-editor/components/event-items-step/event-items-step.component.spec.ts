import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewPartyItem } from '../../../../../core/models';
import { EventItemsStepComponent, type ItemUpdate } from './event-items-step.component';

const ITEMS: NewPartyItem[] = [
  { name: 'Canjica', quantity: 5, unit: 'panelas', fixedQuantity: true },
  { name: 'Quentão', quantity: 6, unit: 'L' },
];

describe('EventItemsStepComponent', () => {
  let fixture: ComponentFixture<EventItemsStepComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventItemsStepComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    fixture = TestBed.createComponent(EventItemsStepComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('lists each item with its quantity and an edit and a remove button', () => {
    const rows = element.querySelectorAll('.items-step__item');
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector('.items-step__item-name')?.textContent).toContain('Canjica');
    expect(rows[0].querySelector('.items-step__item-qty')?.textContent).toContain('5 panelas');
    expect(element.querySelector('button[aria-label="Editar Canjica"]')).toBeTruthy();
    expect(element.querySelector('button[aria-label="Remover Canjica"]')).toBeTruthy();
  });

  it('edits an item in a sheet and leaves the add form as it was', () => {
    const updated = vi.fn<(update: ItemUpdate) => void>();
    fixture.componentInstance.update.subscribe(updated);
    const addName = element.querySelector('[data-testid="item-name-input"]') as HTMLInputElement;
    addName.value = 'Pipoca';
    addName.dispatchEvent(new Event('input'));

    (element.querySelector('button[aria-label="Editar Quentão"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const editName = element.querySelector(
      '[data-testid="edit-item-name-input"]',
    ) as HTMLInputElement;
    expect(element.querySelector('[data-testid="edit-item-sheet"]')).toBeTruthy();
    expect(editName.value).toBe('Quentão');

    editName.value = 'Quentão sem álcool';
    editName.dispatchEvent(new Event('input'));
    (element.querySelector('[data-testid="edit-item-save-btn"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(updated).toHaveBeenCalledWith({
      index: 1,
      item: { name: 'Quentão sem álcool', quantity: 6, unit: 'L', fixedQuantity: false },
    });
    expect(element.querySelector('[data-testid="edit-item-sheet"]')).toBeNull();
    expect(addName.value).toBe('Pipoca');
  });
});
