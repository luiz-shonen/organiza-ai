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

  it('adds another idea in place with the +, and offers it on an empty list too', () => {
    const { fixture, el, button } = create(true);
    const added: string[] = [];
    fixture.componentInstance.add.subscribe((text) => added.push(text));
    button('gift-options-list-add-btn').click();
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="gift-options-list-add-input"]')).not.toBeNull();
    fixture.componentInstance['setAddText']('Vinho tinto');
    button('gift-options-list-add-save-btn').click();
    expect(added).toEqual(['Vinho tinto']);

    fixture.componentRef.setInput('gifts', []);
    fixture.detectChanges();
    expect(el.textContent).toContain('Sem ideias de presente ainda');
    expect(button('gift-options-list-add-btn')).toBeTruthy();
  });

  it('offers no + once the list is full', () => {
    const { fixture, el } = create(true);
    fixture.componentRef.setInput('max', 2);
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="gift-options-list-add-btn"]')).toBeNull();
  });

  it("shows the person's comment above the ideas, folded or not", () => {
    const { fixture, el } = create(false);
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('note', 'Adoro cozinhar\ne tomar café');
    fixture.detectChanges();
    const note = el.querySelector('[data-testid="gift-options-list-note"]');
    expect(note?.textContent).toBe('Adoro cozinhar\ne tomar café');
    expect(el.querySelectorAll('[data-testid="gift-options-list-item"]')).toHaveLength(0);
  });

  it('follows the card\'s "Expandir tudo", and can still be folded on its own', () => {
    const { fixture, el, button } = create(false);
    fixture.componentRef.setInput('collapsible', true);
    fixture.detectChanges();
    const items = () => el.querySelectorAll('[data-testid="gift-options-list-item"]').length;
    expect(items()).toBe(0);
    fixture.componentRef.setInput('openAll', true);
    fixture.detectChanges();
    expect(items()).toBe(2);
    button('gift-options-list-toggle').click();
    fixture.detectChanges();
    expect(items()).toBe(0);
  });
});
