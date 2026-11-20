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

  it('takes several gift options, one field each; Enter opens the next field', async () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.detectChanges();
    const giftInputs = () =>
      Array.from(el().querySelectorAll<HTMLInputElement>('input[data-testid="santa-gift-input"]'));
    const typeGift = (index: number, value: string) => {
      const field = giftInputs()[index];
      field.value = value;
      field.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    expect(giftInputs()).toHaveLength(1);

    type('santa-name-input', 'Ana');
    typeGift(0, 'Chinelo, cor verde, tamanho 36');
    giftInputs()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(giftInputs()).toHaveLength(2);

    typeGift(1, 'Livro de receitas');
    (
      el().querySelector(
        '[data-testid="santa-add-gift-btn"] button, button[data-testid="santa-add-gift-btn"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    typeGift(2, 'Caneca');
    submit();
    expect(emitted[0].giftOptions).toEqual([
      'Chinelo, cor verde, tamanho 36',
      'Livro de receitas',
      'Caneca',
    ]);
    // The form is ready for the next person: one empty field again.
    expect(giftInputs()).toHaveLength(1);
    expect(giftInputs()[0].value).toBe('');
  });

  it('stops at the number of options the organizer allows', () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.componentRef.setInput('maxGiftOptions', 2);
    fixture.detectChanges();
    const addButton = () => el().querySelector('[data-testid="santa-add-gift-btn"]');
    const field = el().querySelector<HTMLInputElement>('input[data-testid="santa-gift-input"]')!;
    field.value = 'Caneca';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (addButton()!.querySelector('button') ?? (addButton() as HTMLButtonElement)).click();
    fixture.detectChanges();
    expect(el().querySelectorAll('input[data-testid="santa-gift-input"]')).toHaveLength(2);
    expect(addButton()).toBeNull();
    expect(el().textContent).toContain('Limite de 2 opções atingido.');
  });

  it('asks for a single option when the organizer allows one', () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.componentRef.setInput('maxGiftOptions', 1);
    fixture.detectChanges();
    expect(el().textContent).toContain('Opção de presente');
    expect(el().querySelector('[data-testid="santa-add-gift-btn"]')).toBeNull();
  });

  it('leaves empty gift fields out', () => {
    fixture.componentRef.setInput('showGiftOptions', true);
    fixture.detectChanges();
    type('santa-name-input', 'Ana');
    submit();
    expect(emitted[0].giftOptions).toEqual([]);
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
