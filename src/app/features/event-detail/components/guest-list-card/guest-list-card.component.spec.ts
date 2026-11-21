import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
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
  it('says nothing about the list when the event has none to bring', async () => {
    await TestBed.configureTestingModule({
      imports: [GuestListCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuestListCardComponent);
    fixture.componentRef.setInput('households', households);
    fixture.componentRef.setInput('hasItems', false);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Não leva nada da lista',
    );
  });

  it('shows each person, their role and what they bring, without phones', async () => {
    const element = await render(false);
    const text = element.textContent ?? '';

    expect(text).toContain('3 confirmados');
    // The guest's name is the panel title only, not repeated inside.
    expect(text.split('Jéssica Melo').length - 1).toBe(1);
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

  it('lists the confirmations waiting for approval, for organizers only, to approve or refuse', async () => {
    await TestBed.configureTestingModule({
      imports: [GuestListCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuestListCardComponent);
    const waiting = {
      id: 'u9',
      name: 'Primo Carlos',
      phone: '(11) 97777-0000',
      people: 2,
      familyGuestIds: [],
    };
    fixture.componentRef.setInput('households', households);
    fixture.componentRef.setInput('pending', [waiting]);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="guest-pending"]')).toBeNull();

    fixture.componentRef.setInput('forOrganizer', true);
    fixture.detectChanges();
    const approve = vi.fn();
    const refuse = vi.fn();
    fixture.componentInstance.approve.subscribe(approve);
    fixture.componentInstance.refuse.subscribe(refuse);
    const row = element.querySelector('[data-testid="guest-pending-row"]');
    expect(element.textContent).toContain('Aguardando aprovação (1)');
    expect(row?.textContent).toContain('Primo Carlos');
    expect(row?.textContent).toContain('2 pessoas');
    (element.querySelector('button[data-testid="guest-approve-btn"]') as HTMLButtonElement).click();
    (element.querySelector('button[data-testid="guest-refuse-btn"]') as HTMLButtonElement).click();
    expect(approve).toHaveBeenCalledWith(waiting);
    expect(refuse).toHaveBeenCalledWith(waiting);
  });
});
