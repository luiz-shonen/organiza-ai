import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
import type { ManualGuestInput } from '../../../../core/models';
import { ManualGuestFormComponent } from './manual-guest-form.component';

async function render(guest: ManualGuestInput | null = null) {
  await TestBed.configureTestingModule({
    imports: [ManualGuestFormComponent],
    providers: [provideNoopAnimations()],
  }).compileComponents();
  const fixture = TestBed.createComponent(ManualGuestFormComponent);
  const save = vi.fn().mockResolvedValue(true);
  fixture.componentRef.setInput('save', save);
  fixture.componentRef.setInput('guest', guest);
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
  return { element, save, type, press };
}

describe('ManualGuestFormComponent', () => {
  it('asks for a name before saving', async () => {
    const { element, save, press } = await render();
    await press('manual-guest-submit-btn');
    expect(save).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Informe o nome');
  });

  it('saves the name, an optional WhatsApp and the companions, the one typed included', async () => {
    const { save, type, press } = await render();
    type('manual-guest-name-input', 'Tia Cida');
    type('manual-guest-companion-input', 'Seu Zé');
    await press('manual-guest-companion-add');
    type('manual-guest-companion-input', 'Dona Lu');
    await press('manual-guest-submit-btn');
    expect(save).toHaveBeenCalledWith({
      name: 'Tia Cida',
      phone: '',
      companions: ['Seu Zé', 'Dona Lu'],
    });
  });

  it('starts with the saved person when editing, and takes a companion out', async () => {
    const { element, save, press } = await render({
      name: 'Tia Cida',
      phone: '(11) 98888-1111',
      companions: ['Seu Zé'],
    });
    expect(element.textContent).toContain('Seu Zé');
    element.querySelector<HTMLElement>('[aria-label="Tirar Seu Zé"]')?.click();
    await press('manual-guest-submit-btn');
    expect(save).toHaveBeenCalledWith({
      name: 'Tia Cida',
      phone: '(11) 98888-1111',
      companions: [],
    });
  });
});
