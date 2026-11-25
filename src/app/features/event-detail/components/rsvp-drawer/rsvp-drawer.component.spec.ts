import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RsvpDrawerResult } from '../../../../core/models';
import { RsvpDrawerComponent } from './rsvp-drawer.component';

describe('RsvpDrawerComponent', () => {
  let fixture: ComponentFixture<RsvpDrawerComponent>;
  let close: ReturnType<typeof vi.fn<(result: RsvpDrawerResult) => void>>;

  beforeEach(async () => {
    close = vi.fn<(result: RsvpDrawerResult) => void>();
    await TestBed.configureTestingModule({
      imports: [RsvpDrawerComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(RsvpDrawerComponent);
    fixture.componentRef.setInput('drawerData', {
      session: { name: 'Carlos', phone: '11999998888' },
      familyMembers: [],
      userId: '',
    });
    fixture.componentInstance.submitted.subscribe(close);
    fixture.detectChanges();
  });

  it('saves a member added in the drawer to the profile, selects it and stays open', async () => {
    const addFamilyMember = vi.fn().mockResolvedValue({
      id: 'fam-1',
      name: 'Lucas',
      relationship: 'child',
      phone: '',
      createdAt: '2026-11-03T00:00:00.000Z',
    });
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentRef.setInput('drawerData', {
      session: { name: 'Carlos', phone: '11999998888' },
      familyMembers: [],
      userId: 'uid-1',
      addFamilyMember,
    });
    fixture.detectChanges();

    await fixture.componentInstance['onAddInlineFamilyMember']({
      name: 'Lucas',
      relationship: 'child',
    });
    fixture.detectChanges();

    expect(addFamilyMember).toHaveBeenCalledWith({
      name: 'Lucas',
      relationship: 'child',
      phone: '',
    });
    expect(fixture.componentInstance.selectedFamilyMemberIds()).toEqual(['fam-1']);
    expect(closed).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();

    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();
    expect(close.mock.calls[0][0].selectedFamilyMembers.map((m) => m.id)).toEqual(['fam-1']);
  });

  it('offers the saved companions and returns only the ones selected', () => {
    fixture.componentRef.setInput('drawerData', {
      session: { name: 'Carlos', phone: '11999998888' },
      familyMembers: [],
      userId: 'uid-1',
      savedCompanions: ['Ana', 'Bruno'],
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.companionNames()).toEqual(['Ana', 'Bruno']);

    fixture.componentInstance['onToggleCompanion']('Ana');
    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();

    expect(close).toHaveBeenCalledWith(expect.objectContaining({ companions: [{ name: 'Ana' }] }));
  });

  it('adds a new companion to the list, already selected', () => {
    fixture.componentInstance['onAddCompanion']('Carla');

    expect(fixture.componentInstance.companionNames()).toEqual(['Carla']);
    expect(fixture.componentInstance.selectedCompanions()).toEqual(['Carla']);
  });

  it('opens an edit with the companions already chosen', () => {
    fixture.componentRef.setInput('drawerData', {
      session: { name: 'Carlos', phone: '11999998888' },
      familyMembers: [],
      userId: 'uid-1',
      savedCompanions: ['Bruno'],
      existing: { companions: ['Ana'], familyMemberIds: [] },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.companionNames()).toEqual(['Bruno', 'Ana']);
    expect(fixture.componentInstance.selectedCompanions()).toEqual(['Ana']);
  });

  it('refuses an incomplete phone, with its message', () => {
    const phoneInput = fixture.nativeElement.querySelector(
      '[data-testid="rsvp-phone-input"]',
    ) as HTMLInputElement;
    phoneInput.value = '1199';
    phoneInput.dispatchEvent(new Event('input'));

    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();
    fixture.detectChanges();

    expect(close).not.toHaveBeenCalled();
    expect(phoneInput.value).toBe('(11) 99');
    expect(fixture.nativeElement.textContent).toContain('Telefone inválido');
  });

  it('shows the profile name, which cannot be edited, and saves the phone formatted', () => {
    const shown = fixture.nativeElement.querySelector('[data-testid="rsvp-guest-name"]');
    expect(shown?.textContent).toContain('Carlos');
    expect(fixture.nativeElement.querySelector('[data-testid="rsvp-name-input"]')).toBeNull();

    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();

    expect(close).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Carlos', phone: '(11) 99999-8888' }),
    );
  });

  describe('amigo oculto', () => {
    const grandma = {
      id: 'fam-ana',
      name: 'Ana',
      relationship: 'relative' as const,
      phone: '',
      createdAt: '2026-11-03T00:00:00.000Z',
    };
    /** Confirming the first time, with Ana checked above: the drawer asks the amigo oculto. */
    const open = (joined: Record<string, readonly string[]> = {}, isOpen = true) => {
      fixture.componentRef.setInput('drawerData', {
        session: { name: 'Maria', phone: '11999998888' },
        familyMembers: [grandma],
        userId: 'uid-maria',
        secretSanta: { open: isOpen, giftOptions: true, maxGiftOptions: 2, joined },
      });
      fixture.detectChanges();
      fixture.componentInstance['onToggleFamilyMember']('fam-ana');
      fixture.detectChanges();
    };
    const el = () => fixture.nativeElement as HTMLElement;
    const confirm = () =>
      (el().querySelector('[data-testid="rsvp-confirm-btn"] button') as HTMLButtonElement).click();
    /** Adds each idea with "+", one at a time; once the list is full the field is gone. */
    const typeGifts = (index: number, ...gifts: string[]) => {
      for (const gift of gifts) {
        const field = el().querySelector(
          `input[data-testid="rsvp-santa-${index}-gift-input"]`,
        ) as HTMLInputElement | null;
        if (!field) return;
        field.value = gift;
        field.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        (
          el().querySelector(
            `button[data-testid="rsvp-santa-${index}-add-gift-btn"]`,
          ) as HTMLButtonElement
        ).click();
        fixture.detectChanges();
      }
    };

    it('shows what the organizer wrote about the amigo oculto, open or closed', () => {
      fixture.componentRef.setInput('drawerData', {
        session: { name: 'Maria', phone: '11999998888' },
        familyMembers: [],
        userId: 'uid-maria',
        secretSanta: {
          open: false,
          giftOptions: false,
          maxGiftOptions: 1,
          joined: {},
          rules: 'Presente até R$ 100.\nTroca no dia 24.',
        },
      });
      fixture.detectChanges();
      expect(el().querySelector('[data-testid="rsvp-santa-rules"]')?.textContent).toBe(
        'Presente até R$ 100.\nTroca no dia 24.',
      );
    });

    it('shows no empty box when the organizer wrote nothing', () => {
      open();
      expect(el().querySelector('[data-testid="rsvp-santa-rules"]')).toBeNull();
    });

    it('asks for each person going: the guest and the relatives checked above', () => {
      open();
      const labels = [...el().querySelectorAll('[data-testid^="rsvp-santa-person-"]')].map((n) =>
        n.textContent?.trim(),
      );
      expect(labels).toEqual(['Você (Maria)', 'Ana']);
    });

    it('returns who takes part, each with their own gift options', () => {
      open();
      (el().querySelector('[data-testid="rsvp-santa-person-0"] input') as HTMLInputElement).click();
      (el().querySelector('[data-testid="rsvp-santa-person-1"] input') as HTMLInputElement).click();
      fixture.detectChanges();
      typeGifts(1, 'Manta', 'Chinelo 37', 'Terceira passa do limite');
      typeGifts(0, 'Livro');
      confirm();

      expect(close).toHaveBeenCalledWith(
        expect.objectContaining({
          secretSanta: { self: ['Livro'], 'f:fam-ana': ['Manta', 'Chinelo 37'] },
        }),
      );
    });

    it('asks every person in the draw for at least one gift option', () => {
      open();
      (el().querySelector('[data-testid="rsvp-santa-person-0"] input') as HTMLInputElement).click();
      fixture.detectChanges();
      confirm();
      fixture.detectChanges();

      expect(close).not.toHaveBeenCalled();
      expect(el().textContent).toContain('Informe pelo menos uma opção de presente');
    });

    it('asks the WhatsApp of a relative in the draw, filled from the profile, optional', () => {
      open();
      expect(el().querySelector('[data-testid="rsvp-santa-phone-1"]')).toBeNull();
      (el().querySelector('[data-testid="rsvp-santa-person-0"] input') as HTMLInputElement).click();
      (el().querySelector('[data-testid="rsvp-santa-person-1"] input') as HTMLInputElement).click();
      fixture.detectChanges();
      // Not for the guest: their own number is the field above.
      expect(el().querySelector('[data-testid="rsvp-santa-phone-0"]')).toBeNull();
      const phone = el().querySelector(
        'input[data-testid="rsvp-santa-phone-1"]',
      ) as HTMLInputElement;
      expect(phone).toBeTruthy();
      phone.value = '21988880000';
      phone.dispatchEvent(new Event('input'));
      typeGifts(0, 'Livro');
      typeGifts(1, 'Manta');
      confirm();

      expect(close).toHaveBeenCalledWith(
        expect.objectContaining({ secretSantaPhones: { 'f:fam-ana': '(21) 98888-0000' } }),
      );
    });

    it('refuses a WhatsApp typed for a relative that is not a phone', () => {
      open();
      (el().querySelector('[data-testid="rsvp-santa-person-1"] input') as HTMLInputElement).click();
      fixture.detectChanges();
      const phone = el().querySelector(
        'input[data-testid="rsvp-santa-phone-1"]',
      ) as HTMLInputElement;
      phone.value = '2198';
      phone.dispatchEvent(new Event('input'));
      typeGifts(1, 'Manta');
      confirm();
      fixture.detectChanges();

      expect(close).not.toHaveBeenCalled();
      expect(el().textContent).toContain('Telefone inválido');
    });

    it('leaves the amigo oculto out of "Editar presença": its card handles it', () => {
      fixture.componentRef.setInput('drawerData', {
        session: { name: 'Maria', phone: '11999998888' },
        familyMembers: [grandma],
        userId: 'uid-maria',
        existing: { companions: [], familyMemberIds: ['fam-ana'] },
        secretSanta: {
          open: true,
          giftOptions: true,
          maxGiftOptions: 2,
          joined: { self: ['Livro'] },
        },
      });
      fixture.detectChanges();
      expect(el().querySelector('[data-testid="rsvp-santa"]')).toBeNull();
      confirm();
      expect(close.mock.calls[0][0].secretSanta).toBeUndefined();
    });

    it('only says sign-ups are closed, and changes nothing', () => {
      open({ self: [] }, false);
      expect(el().querySelector('[data-testid="rsvp-santa-closed"]')?.textContent).toContain(
        'As inscrições do amigo oculto foram encerradas.',
      );
      confirm();
      expect(close.mock.calls[0][0].secretSanta).toBeUndefined();
    });
  });
});
