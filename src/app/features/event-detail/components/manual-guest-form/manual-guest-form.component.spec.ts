import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
import type { ManualGuestInput } from '../../../../core/models';
import {
  ManualGuestFormComponent,
  type ManualGuestSantaSettings,
} from './manual-guest-form.component';

async function render(
  guest: ManualGuestInput | null = null,
  santa: ManualGuestSantaSettings | null = null,
) {
  await TestBed.configureTestingModule({
    imports: [ManualGuestFormComponent],
    providers: [provideNoopAnimations()],
  }).compileComponents();
  const fixture = TestBed.createComponent(ManualGuestFormComponent);
  const save = vi.fn().mockResolvedValue(true);
  fixture.componentRef.setInput('save', save);
  fixture.componentRef.setInput('guest', guest);
  fixture.componentRef.setInput('secretSanta', santa);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const type = (testId: string, value: string) => {
    const input =
      element.querySelector<HTMLInputElement>(`[data-testid="${testId}"] input`) ??
      element.querySelector<HTMLInputElement>(`input[data-testid="${testId}"]`);
    input!.value = value;
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const press = async (testId: string) => {
    element.querySelector<HTMLElement>(`[data-testid="${testId}"]`)?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const check = async (testId: string) => {
    const box =
      element.querySelector<HTMLInputElement>(`[data-testid="${testId}"] input`) ??
      element.querySelector<HTMLInputElement>(`input[data-testid="${testId}"]`);
    box!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  return { element, save, type, press, check, fixture };
}

const cida: ManualGuestInput = {
  name: 'Tia Cida',
  phone: '(11) 98888-1111',
  companions: ['Seu Zé'],
  relatives: [{ id: 'm1_r1', name: 'Lia', relationship: 'child', phone: '' }],
};

describe('ManualGuestFormComponent', () => {
  it('offers people added by hand before, and their phone comes along', async () => {
    const { element, type, fixture } = await render();
    fixture.componentRef.setInput('knownPeople', [
      { name: 'Gustavo Lima', phone: '(31) 99999-0000' },
      { name: 'Ana Souza', phone: '' },
    ]);
    type('manual-guest-name-input', 'gus');
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
    const phone =
      element.querySelector<HTMLInputElement>('[data-testid="manual-guest-phone-input"] input') ??
      element.querySelector<HTMLInputElement>('input[data-testid="manual-guest-phone-input"]');
    expect(phone!.value).toBe('(31) 99999-0000');
  });

  it('asks for a name before saving', async () => {
    const { element, save, press } = await render();
    await press('manual-guest-submit-btn');
    expect(save).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Informe o nome');
  });

  it('has the panels of "Editar presença": family and companions', async () => {
    const { element } = await render();
    expect(element.textContent).toContain('Levar familiares?');
    expect(element.textContent).toContain('Levar acompanhantes?');
    expect(element.querySelector('[data-testid="manual-guest-santa"]')).toBeNull();
  });

  it('saves the name with nobody else when nothing is ticked', async () => {
    const { save, type, press } = await render();
    type('manual-guest-name-input', 'Tia Cida');
    await press('manual-guest-submit-btn');
    expect(save).toHaveBeenCalledWith({
      name: 'Tia Cida',
      phone: '',
      companions: [],
      relatives: [],
    });
  });

  it('starts with the saved relatives and companions ticked, and drops one unticked', async () => {
    const { element, save, press } = await render(cida);
    expect(element.textContent).toContain('Lia');
    expect(element.textContent).toContain('Seu Zé');
    [...element.querySelectorAll<HTMLElement>('app-companion-selector mat-checkbox')]
      .find((box) => box.textContent?.includes('Seu Zé'))
      ?.querySelector('input')
      ?.click();
    await press('manual-guest-submit-btn');
    expect(save).toHaveBeenCalledWith({
      name: 'Tia Cida',
      phone: '(11) 98888-1111',
      companions: [],
      relatives: [{ id: 'm1_r1', name: 'Lia', relationship: 'child', phone: '' }],
    });
  });

  it('asks about the amigo oculto only when adding', async () => {
    const santa = { giftOptions: false, maxGiftOptions: 1, rules: 'Até R$ 50' };
    const editing = await render(cida, santa);
    expect(editing.element.querySelector('[data-testid="manual-guest-santa"]')).toBeNull();
    TestBed.resetTestingModule();

    const { element, save, type, press, check } = await render(null, santa);
    expect(element.textContent).toContain('Até R$ 50');
    type('manual-guest-name-input', 'Tia Cida');
    type('manual-guest-phone-input', '11988881111');
    await check('manual-guest-santa-person-0');
    await press('manual-guest-submit-btn');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Tia Cida',
        secretSanta: [{ name: 'Tia Cida', phone: '(11) 98888-1111', giftOptions: [] }],
      }),
    );
  });
});
