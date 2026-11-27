import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import type { AiSuggestionState } from '../../../core/models';
import { AiSuggestionCardComponent } from './ai-suggestion-card.component';

const READY: AiSuggestionState = {
  status: 'ready',
  suggestion: {
    items: [
      { name: 'Carvão', quantity: 3, unit: 'sacos', reason: 'para a churrasqueira' },
      { name: 'Gelo', quantity: 4, unit: 'sacos', reason: 'bebidas geladas' },
    ],
    tip: 'Compre o gelo no dia.',
  },
  message: '',
};

function render(inputs: {
  state: AiSuggestionState;
  used?: number;
  existingNames?: string[];
  expected?: number | null;
}) {
  const fixture = TestBed.createComponent(AiSuggestionCardComponent);
  fixture.componentRef.setInput('state', inputs.state);
  fixture.componentRef.setInput('used', inputs.used ?? 0);
  fixture.componentRef.setInput('confirmed', 14);
  fixture.componentRef.setInput('expected', inputs.expected === undefined ? 20 : inputs.expected);
  fixture.componentRef.setInput('existingNames', inputs.existingNames ?? []);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  const byTestId = (id: string) => host.querySelectorAll(`[data-testid="${id}"]`);
  return { fixture, host, byTestId };
}

describe('AiSuggestionCardComponent', () => {
  it('says how many of the 3 suggestions the event has left', () => {
    const { byTestId } = render({ state: READY, used: 1 });
    expect(byTestId('ai-suggestion-remaining')[0].textContent).toContain(
      'Restam 2 de 3 sugestões para este evento.',
    );
    expect(byTestId('ai-suggestion-generate')).toHaveLength(1);
  });

  it('hides the button once the event used all 3', () => {
    const { byTestId } = render({ state: READY, used: 3 });
    expect(byTestId('ai-suggestion-remaining')[0].textContent).toContain(
      'Este evento já usou as 3 sugestões do Organiza AI.',
    );
    expect(byTestId('ai-suggestion-generate')).toHaveLength(0);
  });

  it('shows each item complete, with "Adicionar", and "Na lista" once it is on the list', () => {
    const { host, byTestId } = render({ state: READY, existingNames: ['carvao'] });
    const list = byTestId('ai-suggestion-list')[0].textContent ?? '';
    expect(list).toContain('Gelo');
    expect(list).toContain('4 sacos');
    expect(byTestId('ai-suggestion-added')).toHaveLength(1);
    expect(byTestId('ai-suggestion-add')).toHaveLength(1);
    expect(host.textContent).toContain('Compre o gelo no dia.');
  });

  it('emits the item to add', () => {
    const { fixture, byTestId } = render({ state: READY });
    const added = vi.fn();
    fixture.componentInstance.add.subscribe(added);
    (byTestId('ai-suggestion-add')[1] as HTMLElement).click();
    expect(added).toHaveBeenCalledWith(READY.suggestion!.items[1]);
  });

  it('shows a subtle note while it works and the friendly message on failure', () => {
    const loading = render({ state: { status: 'loading', suggestion: null, message: '' } });
    expect(loading.byTestId('ai-suggestion-loading')).toHaveLength(1);

    const failed = render({
      state: { status: 'error', suggestion: null, message: 'Nossos assistentes estão ocupados.' },
    });
    expect(failed.host.textContent).toContain('Nossos assistentes estão ocupados.');
  });

  describe('with no expected number yet', () => {
    const IDLE: AiSuggestionState = { status: 'idle', suggestion: null, message: '' };

    function type(host: HTMLElement, text: string) {
      const input = host.querySelector(
        '[data-testid="ai-expected-input"] input, input[data-testid="ai-expected-input"]',
      ) as HTMLInputElement;
      input.value = text;
      input.dispatchEvent(new Event('input'));
    }

    it('asks for it instead of offering suggestions', () => {
      const { host, byTestId } = render({ state: IDLE, expected: null });
      expect(host.textContent).toContain('Quer sugestões para a lista?');
      expect(byTestId('ai-expected-form')).toHaveLength(1);
      expect(byTestId('ai-suggestion-generate')).toHaveLength(0);
    });

    it('saves a number from 1 to 999 and refuses anything else', () => {
      const { fixture, host, byTestId } = render({ state: IDLE, expected: null });
      const saved = vi.fn();
      fixture.componentInstance.expectedSave.subscribe(saved);

      type(host, '0');
      (byTestId('ai-expected-save')[0] as HTMLElement).click();
      fixture.detectChanges();
      expect(saved).not.toHaveBeenCalled();
      expect(host.textContent).toContain('Digite um número de 1 a 999');

      type(host, ' 30 ');
      (byTestId('ai-expected-save')[0] as HTMLElement).click();
      expect(saved).toHaveBeenCalledWith(30);
    });
  });
});
