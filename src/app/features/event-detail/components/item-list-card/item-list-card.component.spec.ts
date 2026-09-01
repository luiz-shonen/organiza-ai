import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemListCardComponent } from './item-list-card.component';
import { PartyItem } from '../../../../core/models';

describe('ItemListCardComponent', () => {
  let component: ItemListCardComponent;
  let componentRef: ComponentRef<ItemListCardComponent>;
  let fixture: ComponentFixture<ItemListCardComponent>;

  const mockItems: PartyItem[] = [
    {
      id: 'item-1',
      name: 'Refrigerante 2L',
      quantity: 3,
      claimedBy: null,
    },
    {
      id: 'item-2',
      name: 'Bolo de Chocolate',
      quantity: 1,
      claimedBy: { uid: 'user-lucas', name: 'Lucas', phone: '11999998888' },
    },
    {
      id: 'item-3',
      name: 'Salgadinhos',
      quantity: 100,
      claimedBy: { phone: '11988887777', name: 'Mariana', uid: 'user-mariana' },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemListCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemListCardComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create the component and render item list', () => {
    componentRef.setInput('items', mockItems);
    componentRef.setInput('currentUserId', 'user-lucas');
    fixture.detectChanges();

    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    const names = Array.from(compiled.querySelectorAll('.item-list-card__name')).map((el) =>
      el.textContent?.trim(),
    );
    expect(names).toEqual(['Refrigerante 2L', 'Bolo de Chocolate', 'Salgadinhos']);

    const statuses = Array.from(compiled.querySelectorAll('.item-list-card__status')).map((el) =>
      el.textContent?.trim(),
    );
    expect(statuses).toContain('Disponível');
    expect(statuses).toContain('Levado por Lucas');
    expect(statuses).toContain('Levado por Mariana');
  });

  it('should emit onClaim when "Eu Levo" button is clicked for an unclaimed item', () => {
    componentRef.setInput('items', mockItems);
    componentRef.setInput('currentUserId', 'user-other');
    fixture.detectChanges();

    const claimSpy = vi.fn();
    component.claim.subscribe(claimSpy);

    const claimBtn = fixture.nativeElement.querySelector(
      '.item-list-card__claim-btn button',
    ) as HTMLButtonElement;
    expect(claimBtn).toBeTruthy();
    claimBtn.click();

    expect(claimSpy).toHaveBeenCalledWith('item-1');
  });

  it('should emit onUnclaim when claimant clicks "Desistir" for their claimed item (by uid)', () => {
    componentRef.setInput('items', mockItems);
    componentRef.setInput('currentUserId', 'user-lucas');
    fixture.detectChanges();

    const unclaimSpy = vi.fn();
    component.unclaim.subscribe(unclaimSpy);

    const unclaimBtn = fixture.nativeElement.querySelector(
      '.item-list-card__unclaim-btn button',
    ) as HTMLButtonElement;
    expect(unclaimBtn).toBeTruthy();
    unclaimBtn.click();

    expect(unclaimSpy).toHaveBeenCalledWith('item-2');
  });

  it('should emit onUnclaim when claimant clicks "Desistir" for their claimed item (by phone)', () => {
    componentRef.setInput('items', mockItems);
    componentRef.setInput('currentUserId', '11988887777');
    fixture.detectChanges();

    const unclaimSpy = vi.fn();
    component.unclaim.subscribe(unclaimSpy);

    const unclaimBtn = fixture.nativeElement.querySelector(
      '.item-list-card__unclaim-btn button',
    ) as HTMLButtonElement;
    expect(unclaimBtn).toBeTruthy();
    unclaimBtn.click();

    expect(unclaimSpy).toHaveBeenCalledWith('item-3');
  });

  it('should disable "Eu Levo" button when currentUserId is null', () => {
    componentRef.setInput('items', mockItems);
    componentRef.setInput('currentUserId', null);
    fixture.detectChanges();

    const claimBtn = fixture.nativeElement.querySelector(
      '.item-list-card__claim-btn button',
    ) as HTMLButtonElement;
    expect(claimBtn.disabled).toBe(true);
  });

  it('should render empty state message when items array is empty', () => {
    componentRef.setInput('items', []);
    componentRef.setInput('currentUserId', 'user-lucas');
    fixture.detectChanges();

    const emptyEl = fixture.nativeElement.querySelector('.item-list-card__empty');
    expect(emptyEl).toBeTruthy();
    expect(emptyEl.textContent).toContain('Nenhum item adicionado a este evento ainda.');
  });
});
