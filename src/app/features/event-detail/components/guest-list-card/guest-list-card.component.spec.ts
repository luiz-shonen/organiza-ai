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

  it('lists the host first as "Organizador(a)", counted as going but not as an answer', async () => {
    await TestBed.configureTestingModule({
      imports: [GuestListCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuestListCardComponent);
    const host: GuestHousehold = {
      id: 'owner',
      name: 'Luiz Rodrigues',
      phone: '',
      people: [],
      bring: [],
      members: [{ name: 'Luiz Rodrigues', role: 'Convidado(a)', bring: [] }],
      host: true,
    };
    fixture.componentRef.setInput('households', [host]);
    fixture.componentRef.setInput('hasItems', false);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="guest-host-tag"]')?.textContent).toContain(
      'Organizador(a)',
    );
    expect(element.textContent).toContain('Ninguém respondeu ainda');
  });

  it('shows each person and what they bring, without phones', async () => {
    const element = await render(false);
    const text = element.textContent ?? '';

    expect(element.querySelector('[data-testid="card-header-count"]')?.textContent).toContain('3');
    // The guest's name is the panel title only, not repeated inside.
    expect(text.split('Jéssica Melo').length - 1).toBe(1);
    expect(text).toContain('2 pessoas · 2 itens');
    expect(text).toContain('Leva:');
    const lines = Array.from(element.querySelectorAll('.guest-list__items li'), (li) =>
      li.textContent?.trim(),
    );
    expect(lines).toEqual(['3 L de Sorvete', '2 garrafas de Refrigerante']);
    // No "Família" caption under the name: a relative carries their kinship tag instead.
    expect(text).not.toContain('Família');
    expect(text).toContain('Não leva nada da lista');
    // Family and companions are listed under the guest, without a heading or "Convidado(a)".
    expect(text).not.toContain('Vão com');
    expect(text).not.toContain('Convidado(a)');
    expect(text).not.toContain('99267');
    expect(text).not.toContain('Não poderão ir');
  });

  it('adds phones, the declines and the export for organizers', async () => {
    const element = await render(true);
    const text = element.textContent ?? '';

    expect(text).toContain('(31) 99267-7624');
    expect(
      element.querySelector('#guest-list-declines-title')?.textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('Não poderão ir 1');
    expect(text).toContain('Vou estar viajando.');
    expect(element.querySelector('[aria-label="Baixar a lista em PDF"]')).not.toBeNull();
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

  it('starts with every family folded and opens or folds them all at once', async () => {
    await render(false);
    const fixture = TestBed.createComponent(GuestListCardComponent);
    fixture.componentRef.setInput('households', households);
    fixture.componentRef.setInput('hasItems', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const panels = () =>
      [...el.querySelectorAll('mat-expansion-panel')].map((panel) =>
        panel.classList.contains('mat-expanded'),
      );
    expect(panels().every((open) => !open)).toBe(true);
    const button = () =>
      el.querySelector(
        '[data-testid="guest-list-fold-all"] button, button[data-testid="guest-list-fold-all"]',
      ) as HTMLButtonElement;
    expect(button().textContent).toContain('Expandir tudo');
    button().click();
    fixture.detectChanges();
    expect(panels().every((open) => open)).toBe(true);
    expect(button().textContent).toContain('Recolher tudo');
  });

  it('shows a relative\'s phone under the name to organizers only, with no "Família" caption', async () => {
    await TestBed.configureTestingModule({
      imports: [GuestListCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    const withPhone: GuestHousehold[] = [
      {
        ...households[0],
        members: [
          households[0].members[0],
          {
            name: 'Luiz Rodrigues',
            role: 'Família',
            kinship: 'Cônjuge',
            phone: '(31) 99267-7624',
            bring: [],
          },
        ],
      },
    ];
    const show = (forOrganizer: boolean) => {
      const fixture = TestBed.createComponent(GuestListCardComponent);
      fixture.componentRef.setInput('households', withPhone);
      fixture.componentRef.setInput('forOrganizer', forOrganizer);
      fixture.detectChanges();
      (
        fixture.nativeElement.querySelector(
          'button[data-testid="guest-list-fold-all"], [data-testid="guest-list-fold-all"] button',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).querySelector('.guest-list__people')!
        .textContent!;
    };
    const organizer = show(true);
    expect(organizer).toContain('(31) 99267-7624');
    expect(organizer).toContain('Cônjuge');
    expect(organizer).not.toContain('Família');
    expect(show(false)).not.toContain('99267');
  });

  describe('someone added by hand', () => {
    const cida: GuestHousehold = {
      id: 'm1',
      name: 'Tia Cida',
      phone: '',
      people: ['Seu Zé'],
      bring: [],
      members: [
        { name: 'Tia Cida', role: 'Convidado(a)', bring: [] },
        { name: 'Seu Zé', role: 'Acompanhante', bring: [] },
      ],
      manual: true,
    };

    async function renderManual(forOrganizer: boolean) {
      await TestBed.configureTestingModule({
        imports: [GuestListCardComponent],
        providers: [provideNoopAnimations()],
      }).compileComponents();
      const fixture = TestBed.createComponent(GuestListCardComponent);
      const save = vi.fn().mockResolvedValue(true);
      fixture.componentRef.setInput('households', [...households, cida]);
      fixture.componentRef.setInput('forOrganizer', forOrganizer);
      fixture.componentRef.setInput('saveManual', forOrganizer ? save : null);
      fixture.detectChanges();
      return { fixture, save, el: fixture.nativeElement as HTMLElement };
    }
    const button = (el: HTMLElement, testId: string) =>
      el.querySelector(
        `[data-testid="${testId}"] button, button[data-testid="${testId}"]`,
      ) as HTMLButtonElement | null;

    it('lets organizers add, edit and remove them, with no "à mão" tag', async () => {
      const { fixture, save, el } = await renderManual(true);
      expect(el.querySelector('[data-testid="guest-manual-tag"]')).toBeNull();
      expect(button(el, 'guest-manual-add-btn')).not.toBeNull();

      const removed = vi.fn();
      fixture.componentInstance.removeManual.subscribe(removed);
      button(el, 'guest-manual-remove-btn')!.click();
      expect(removed).toHaveBeenCalledWith(cida);

      button(el, 'guest-manual-edit-btn')!.click();
      fixture.detectChanges();
      const nameInput = document.querySelector<HTMLInputElement>(
        'input[data-testid="manual-guest-name-input"]',
      );
      expect(nameInput?.value).toBe('Tia Cida');
      button(document.body, 'manual-guest-submit-btn')!.click();
      await fixture.whenStable();
      expect(save).toHaveBeenCalledWith(
        { name: 'Tia Cida', phone: '', companions: ['Seu Zé'] },
        'm1',
      );
    });

    it('shows guests neither the button, the tag nor the actions', async () => {
      const { el } = await renderManual(false);
      expect(button(el, 'guest-manual-add-btn')).toBeNull();
      expect(el.querySelector('[data-testid="guest-manual-tag"]')).toBeNull();
      expect(button(el, 'guest-manual-edit-btn')).toBeNull();
      expect(el.textContent).toContain('Tia Cida');
    });
  });
});
