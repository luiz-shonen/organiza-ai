import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SecretSantaParticipantFormComponent } from './secret-santa-participant-form.component';
import type { SecretSantaParticipantInput } from '../../../../../core/models';

describe('SecretSantaParticipantFormComponent', () => {
  let fixture: ComponentFixture<SecretSantaParticipantFormComponent>;
  let emitted: SecretSantaParticipantInput[];

  const el = () => fixture.nativeElement as HTMLElement;
  const input = (testId: string) =>
    el().querySelector(
      `[data-testid="${testId}"] input, input[data-testid="${testId}"]`,
    ) as HTMLInputElement | null;
  const type = (testId: string, value: string) => {
    const field = input(testId)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const submit = () => {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretSantaParticipantFormComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SecretSantaParticipantFormComponent);
    emitted = [];
    fixture.componentInstance.submitted.subscribe((p) => emitted.push(p));
    fixture.detectChanges();
  });

  it('adds a participant with a tidy name and a formatted phone', () => {
    type('santa-name-input', '  Jéssica   Melo ');
    type('santa-phone-input', '11988881111');
    submit();
    expect(emitted).toEqual([{ name: 'Jéssica Melo', phone: '(11) 98888-1111', giftOptions: [] }]);
  });

  it('with a save, keeps what was typed when it fails and clears when it works', async () => {
    let result = false;
    const saved: SecretSantaParticipantInput[] = [];
    fixture.componentRef.setInput('save', async (participant: SecretSantaParticipantInput) => {
      saved.push(participant);
      return result;
    });
    type('santa-name-input', 'Gustavo');
    type('santa-phone-input', '11988881111');
    submit();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    expect(saved).toHaveLength(1);
    expect(emitted).toEqual([]);
    expect(input('santa-name-input')!.value).toBe('Gustavo');

    result = true;
    submit();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    expect(saved).toHaveLength(2);
    expect(input('santa-name-input')!.value).toBe('');
  });

  it('refuses an empty name or an invalid phone', () => {
    submit();
    type('santa-name-input', 'Ana');
    type('santa-phone-input', '123');
    submit();
    expect(emitted).toEqual([]);
    expect(el().textContent).toContain('Telefone inválido');
  });

  it('hides gift options unless the event asks for them', () => {
    expect(input('santa-gift-input')).toBeNull();
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.detectChanges();
    expect(input('santa-gift-input')).not.toBeNull();
  });

  const giftInput = () =>
    el().querySelector<HTMLInputElement>('input[data-testid="santa-gift-input"]');
  const typeGift = (value: string) => {
    const field = giftInput()!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const addGiftButton = () =>
    el().querySelector(
      '[data-testid="santa-add-gift-btn"] button, button[data-testid="santa-add-gift-btn"]',
    ) as HTMLButtonElement | null;
  const giftItems = () =>
    Array.from(el().querySelectorAll('[data-testid="santa-gift-item"]')).map((item) =>
      item.querySelector('.gift-field__text')!.textContent!.trim(),
    );

  it('adds gift ideas to a list with + or Enter, and sends one still typed', () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.detectChanges();
    type('santa-name-input', 'Ana');
    typeGift('Chinelo, cor verde, tamanho 36');
    giftInput()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(giftItems()).toEqual(['Chinelo, cor verde, tamanho 36']);
    expect(giftInput()!.value).toBe('');

    typeGift('Livro de receitas');
    addGiftButton()!.click();
    fixture.detectChanges();
    expect(el().textContent).toContain('2 de 10');

    typeGift('Caneca');
    submit();
    expect(emitted[0].giftOptions).toEqual([
      'Chinelo, cor verde, tamanho 36',
      'Livro de receitas',
      'Caneca',
    ]);
    // Ready for the next person: no ideas, an empty field.
    expect(giftItems()).toEqual([]);
    expect(giftInput()!.value).toBe('');
  });

  it('takes an idea out of the list', () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.detectChanges();
    typeGift('Caneca');
    addGiftButton()!.click();
    fixture.detectChanges();
    el()
      .querySelector<HTMLButtonElement>(
        '[data-testid="santa-gift-item"] [aria-label="Remover Caneca"]',
      )!
      .click();
    fixture.detectChanges();
    expect(giftItems()).toEqual([]);
  });

  const editInput = () =>
    el().querySelector<HTMLInputElement>('input[data-testid="santa-gift-edit-input"]');
  const typeEdit = (value: string) => {
    editInput()!.value = value;
    editInput()!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const key = (target: HTMLElement, name: string) => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    fixture.detectChanges();
  };

  it('edits an idea in place: the pencil or the text opens it, Enter keeps it', () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.detectChanges();
    typeGift('Chinelo Kenner, Marrom, Tamanho 38');
    addGiftButton()!.click();
    fixture.detectChanges();

    (el().querySelector('.gift-field__text') as HTMLElement).click();
    fixture.detectChanges();
    expect(editInput()!.value).toBe('Chinelo Kenner, Marrom, Tamanho 38');
    typeEdit('Chinelo Kenner, Marrom, Tamanho 39');
    key(editInput()!, 'Enter');
    expect(emitted).toEqual([]);
    expect(giftItems()).toEqual(['Chinelo Kenner, Marrom, Tamanho 39']);

    (
      el().querySelector(
        '[data-testid="santa-gift-edit-btn"] button, button[data-testid="santa-gift-edit-btn"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    typeEdit('Outra coisa');
    key(editInput()!, 'Escape');
    expect(giftItems()).toEqual(['Chinelo Kenner, Marrom, Tamanho 39']);
  });

  it('an idea emptied while editing is taken out, and one being edited goes with the person', () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.detectChanges();
    type('santa-name-input', 'Carlos');
    for (const gift of ['Caneca', 'Livro']) {
      typeGift(gift);
      addGiftButton()!.click();
      fixture.detectChanges();
    }
    (el().querySelector('.gift-field__text') as HTMLElement).click();
    fixture.detectChanges();
    typeEdit('');
    key(editInput()!, 'Enter');
    expect(giftItems()).toEqual(['Livro']);

    (el().querySelector('.gift-field__text') as HTMLElement).click();
    fixture.detectChanges();
    typeEdit('Livro de receitas');
    submit();
    expect(emitted[0].giftOptions).toEqual(['Livro de receitas']);
  });

  it('stops at the number of options the organizer allows', () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.componentRef.setInput('maxGiftOptions', 2);
    fixture.detectChanges();
    for (const gift of ['Caneca', 'Livro']) {
      typeGift(gift);
      addGiftButton()!.click();
      fixture.detectChanges();
    }
    expect(giftItems()).toEqual(['Caneca', 'Livro']);
    expect(giftInput()).toBeNull();
    expect(el().textContent).toContain('Limite de 2 opções atingido.');
  });

  it('asks for a single option when the organizer allows one', () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.componentRef.setInput('maxGiftOptions', 1);
    fixture.detectChanges();
    expect(el().textContent).toContain('Opção de presente');
    expect(el().textContent).not.toContain('0 de 1');
  });

  it('asks for at least one idea when the event wants gift options', () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.detectChanges();
    type('santa-name-input', 'Ana');
    submit();
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(el().textContent).toContain('Informe pelo menos uma opção de presente');
  });

  it('offers people the organizer knows, and their phone comes along', () => {
    fixture.componentRef.setInput('knownPeople', [
      { name: 'Gustavo Lima', phone: '(31) 99999-0000' },
      { name: 'Ana Souza', phone: '' },
    ]);
    type('santa-name-input', 'gus');
    const component = fixture.componentInstance as unknown as {
      nameSuggestions: () => { label: string; detail?: string }[];
      pickPerson: (s: { label: string; detail?: string }) => void;
    };
    expect(component.nameSuggestions()).toContainEqual({
      label: 'Gustavo Lima',
      detail: '(31) 99999-0000',
    });
    component.pickPerson({ label: 'Gustavo Lima', detail: '(31) 99999-0000' });
    fixture.detectChanges();
    expect(input('santa-phone-input')!.value).toBe('(31) 99999-0000');
  });

  it('fills in the participant being edited', () => {
    fixture.componentRef.setInput('participant', {
      name: 'Luiz',
      phone: '(11) 98888-1111',
      giftOptions: [],
      guestId: 'g1',
    });
    fixture.detectChanges();
    expect(input('santa-name-input')!.value).toBe('Luiz');
    submit();
    expect(emitted[0]).toEqual({
      name: 'Luiz',
      phone: '(11) 98888-1111',
      giftOptions: [],
      guestId: 'g1',
    });
  });
});
