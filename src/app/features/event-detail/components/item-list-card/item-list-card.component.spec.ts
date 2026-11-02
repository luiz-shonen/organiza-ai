import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemListCardComponent } from './item-list-card.component';
import type { EventClaims, PartyItem } from '../../../../core/models';
import { buildItemProgress } from '../../../../core/utils';

describe('ItemListCardComponent', () => {
  let component: ItemListCardComponent;
  let componentRef: ComponentRef<ItemListCardComponent>;
  let fixture: ComponentFixture<ItemListCardComponent>;

  const items: PartyItem[] = [
    { id: 'bolo', name: 'Bolo de milho', quantity: 10, unit: 'un.', claimedBy: null },
    {
      id: 'pipoca',
      name: 'Pipoca doce',
      quantity: 50,
      unit: 'pacotes',
      fixedQuantity: true,
      claimedBy: null,
    },
  ];
  const claims: EventClaims[] = [
    {
      id: 'ana',
      name: 'Ana',
      updatedAt: '',
      entries: [
        { itemId: 'bolo', memberId: null, who: 'Ana', quantity: 4, bought: false },
        { itemId: 'pipoca', memberId: null, who: 'Ana', quantity: 50, bought: false },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemListCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemListCardComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('progress', buildItemProgress(items, claims));
    fixture.detectChanges();
  });

  it('shows what is missing for open items and a check for complete ones', () => {
    const element = fixture.nativeElement as HTMLElement;
    const cards = element.querySelectorAll('[data-testid="item-card"]');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Faltam 6 un.');
    expect(cards[1].classList).toContain('item-list-card__item--complete');
    expect(element.querySelector('[data-testid="item-remaining-count"]')?.textContent).toContain(
      '1 de 2',
    );
  });

  it('lists who brings what next to the split bar', () => {
    const chips = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.org-split-progress__chip',
    );
    expect(chips[0].textContent).toContain('Ana');
    expect(chips[0].textContent).toContain('4');
  });

  it('emits the item id from "Eu levo" only on items that still need someone', () => {
    const claimSpy = vi.fn();
    component.claim.subscribe(claimSpy);

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'button[data-testid^="claim-"]',
    );
    expect(buttons).toHaveLength(1);
    buttons[0].click();
    expect(claimSpy).toHaveBeenCalledWith('bolo');
  });

  it('explains a fixed quantity when asked', () => {
    const element = fixture.nativeElement as HTMLElement;
    const fixedButton = element.querySelector('.item-list-card__fixed') as HTMLButtonElement;
    fixedButton.click();
    fixture.detectChanges();
    expect(element.querySelector('.item-list-card__hint')?.textContent).toContain(
      'todos os 50 pacotes',
    );
  });

  it('renders the empty message without items', () => {
    componentRef.setInput('progress', []);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.item-list-card__empty')?.textContent,
    ).toContain('Nenhum item adicionado a este evento ainda.');
  });
});
