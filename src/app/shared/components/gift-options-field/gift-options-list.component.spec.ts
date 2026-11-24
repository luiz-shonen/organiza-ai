import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { GiftOptionsListComponent, type GiftOptionEdit } from './gift-options-list.component';

describe('GiftOptionsListComponent', () => {
  function create(editable: boolean) {
    const fixture = TestBed.createComponent(GiftOptionsListComponent);
    fixture.componentRef.setInput('gifts', ['Chinelo 39', 'Livro']);
    fixture.componentRef.setInput('editable', editable);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const button = (id: string, n = 0) =>
      el.querySelectorAll(`[data-testid="${id}"] button, button[data-testid="${id}"]`)[
        n
      ] as HTMLButtonElement;
    return { fixture, el, button };
  }

  it('shows the ideas to read, with nothing to press, unless editable', () => {
    const { el } = create(false);
    expect(el.querySelectorAll('[data-testid="gift-options-list-item"]')).toHaveLength(2);
    expect(el.querySelector('button')).toBeNull();
  });

  it('edits an idea in place and asks the page to save the new text', () => {
    const { fixture, button } = create(true);
    const edits: GiftOptionEdit[] = [];
    fixture.componentInstance.edit.subscribe((e) => edits.push(e));
    button('gift-options-list-edit-btn', 1).click();
    fixture.detectChanges();
    fixture.componentInstance['setEditText']('Livro de receitas');
    button('gift-options-list-save-btn').click();
    expect(edits).toEqual([{ index: 1, text: 'Livro de receitas' }]);
  });

  it('asks the page to remove an idea', () => {
    const { fixture, button } = create(true);
    const removed: number[] = [];
    fixture.componentInstance.remove.subscribe((i) => removed.push(i));
    button('gift-options-list-remove-btn', 0).click();
    expect(removed).toEqual([0]);
  });
});
