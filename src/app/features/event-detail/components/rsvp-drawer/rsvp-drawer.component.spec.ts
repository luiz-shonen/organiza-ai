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
    const open = (joined: Record<string, readonly string[]> = {}, isOpen = true) => {
      fixture.componentRef.setInput('drawerData', {
        session: { name: 'Maria', phone: '11999998888' },
        familyMembers: [grandma],
        userId: 'uid-maria',
        existing: { companions: [], familyMemberIds: ['fam-ana'] },
        secretSanta: { open: isOpen, giftOptions: true, maxGiftOptions: 2, joined },
      });
      fixture.detectChanges();
    };
    const el = () => fixture.nativeElement as HTMLElement;
    const confirm = () =>
      (el().querySelector('[data-testid="rsvp-confirm-btn"] button') as HTMLButtonElement).click();

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
      const gifts = el().querySelector(
        'textarea[data-testid="rsvp-santa-gifts-1"]',
      ) as HTMLTextAreaElement;
      gifts.value = 'Manta\nChinelo 37\nTerceira passa do limite';
      gifts.dispatchEvent(new Event('input'));
      confirm();

      expect(close).toHaveBeenCalledWith(
        expect.objectContaining({
          secretSanta: { self: [], 'f:fam-ana': ['Manta', 'Chinelo 37'] },
        }),
      );
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
      confirm();
      fixture.detectChanges();

      expect(close).not.toHaveBeenCalled();
      expect(el().textContent).toContain('Telefone inválido');
    });

    it('opens an edit with who is already in, and leaves out someone no longer going', () => {
      open({ self: ['Livro'], 'f:fam-ana': [] });
      expect(
        (el().querySelector('textarea[data-testid="rsvp-santa-gifts-0"]') as HTMLTextAreaElement)
          .value,
      ).toBe('Livro');
      fixture.componentInstance['onToggleFamilyMember']('fam-ana');
      fixture.detectChanges();
      confirm();

      expect(close).toHaveBeenCalledWith(
        expect.objectContaining({ secretSanta: { self: ['Livro'] } }),
      );
    });

    it('only says sign-ups are closed, and changes nothing', () => {
      open({ self: [] }, false);
      expect(el().querySelector('[data-testid="rsvp-santa-closed"]')?.textContent).toContain(
        'As inscrições do amigo oculto estão fechadas.',
      );
      confirm();
      expect(close.mock.calls[0][0].secretSanta).toBeUndefined();
    });
  });
});
