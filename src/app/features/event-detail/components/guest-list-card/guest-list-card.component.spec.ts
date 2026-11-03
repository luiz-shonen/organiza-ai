import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it } from 'vitest';
import type { GuestHousehold } from '../../../../core/utils';
import { GuestListCardComponent } from './guest-list-card.component';

const households: GuestHousehold[] = [
  {
    id: 'u1',
    name: 'Jéssica Melo',
    phone: '(31) 99267-7624',
    people: ['Luiz Rodrigues'],
    bring: ['3 L de Sorvete', '2 garrafas de Refrigerante'],
    members: [
      { name: 'Jéssica Melo', role: 'Convidado(a)', bring: ['3 L de Sorvete'] },
      { name: 'Luiz Rodrigues', role: 'Família', bring: ['2 garrafas de Refrigerante'] },
    ],
  },
  {
    id: 'u2',
    name: 'Fernanda',
    phone: '',
    people: [],
    bring: [],
    members: [{ name: 'Fernanda', role: 'Convidado(a)', bring: [] }],
  },
];

async function render(forOrganizer: boolean) {
  await TestBed.configureTestingModule({
    imports: [GuestListCardComponent],
    providers: [provideNoopAnimations()],
  }).compileComponents();
  const fixture = TestBed.createComponent(GuestListCardComponent);
  fixture.componentRef.setInput('households', households);
  fixture.componentRef.setInput('forOrganizer', forOrganizer);
  fixture.componentRef.setInput('declines', [
    { id: 'u3', name: 'Ana', message: 'Vou estar viajando.', declinedAt: '' },
  ]);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('GuestListCardComponent', () => {
  it('shows each person, their role and what they bring, without phones', async () => {
    const element = await render(false);
    const text = element.textContent ?? '';

    expect(text).toContain('2 confirmados · 3 pessoas');
    expect(text).toContain('+1 · 2 itens');
    expect(text).toContain('Leva:');
    const lines = Array.from(element.querySelectorAll('.guest-list__items li'), (li) =>
      li.textContent?.trim(),
    );
    expect(lines).toEqual(['3 L de Sorvete', '2 garrafas de Refrigerante']);
    expect(text).toContain('Família');
    expect(text).toContain('Não leva nada da lista');
    expect(text).not.toContain('99267');
    expect(text).not.toContain('Não poderão ir');
  });

  it('adds phones, the declines and the export for organizers', async () => {
    const element = await render(true);
    const text = element.textContent ?? '';

    expect(text).toContain('(31) 99267-7624');
    expect(text).toContain('Não poderão ir (1)');
    expect(text).toContain('Vou estar viajando.');
    expect(element.querySelector('[aria-label="Baixar a lista em Excel"]')).not.toBeNull();
  });
});
