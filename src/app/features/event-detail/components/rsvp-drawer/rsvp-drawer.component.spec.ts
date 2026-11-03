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

  it('reveals exactly the requested ordered companion fields with accessible labels', () => {
    const countInput = fixture.nativeElement.querySelector(
      '[data-testid="rsvp-companions-input"]',
    ) as HTMLInputElement;
    countInput.value = '3';
    countInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('[formarrayname="companions"] input');
    expect(inputs).toHaveLength(3);
    expect(fixture.nativeElement.textContent).toContain('Acompanhante 1');
    expect(fixture.nativeElement.textContent).toContain('Acompanhante 3');
  });

  it('prevents submission and identifies a blank revealed companion', () => {
    const countInput = fixture.nativeElement.querySelector(
      '[data-testid="rsvp-companions-input"]',
    ) as HTMLInputElement;
    countInput.value = '1';
    countInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();
    fixture.detectChanges();

    expect(close).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Nome do acompanhante é obrigatório');
  });

  it('returns ordered named companions and selected family members only when valid', () => {
    const countInput = fixture.nativeElement.querySelector(
      '[data-testid="rsvp-companions-input"]',
    ) as HTMLInputElement;
    countInput.value = '2';
    countInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll(
      '[formarrayname="companions"] input',
    ) as NodeListOf<HTMLInputElement>;
    inputs[0].value = ' Ana ';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = 'Bia';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();

    expect(close).toHaveBeenCalledWith(
      expect.objectContaining({
        companions: [{ name: 'Ana' }, { name: 'Bia' }],
      }),
    );
  });

  it('rejects a companion count greater than ten', () => {
    const countInput = fixture.nativeElement.querySelector(
      '[data-testid="rsvp-companions-input"]',
    ) as HTMLInputElement;
    countInput.value = '11';
    countInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();
    fixture.detectChanges();

    expect(close).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Informe um número entre 0 e 10');
  });

  it('refuses a name with digits and an incomplete phone, with their messages', () => {
    const nameInput = fixture.nativeElement.querySelector(
      '[data-testid="rsvp-name-input"]',
    ) as HTMLInputElement;
    const phoneInput = fixture.nativeElement.querySelector(
      '[data-testid="rsvp-phone-input"]',
    ) as HTMLInputElement;
    nameInput.value = 'Carlos 2';
    nameInput.dispatchEvent(new Event('input'));
    phoneInput.value = '1199';
    phoneInput.dispatchEvent(new Event('input'));

    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();
    fixture.detectChanges();

    expect(close).not.toHaveBeenCalled();
    expect(phoneInput.value).toBe('(11) 99');
    expect(fixture.nativeElement.textContent).toContain(
      'Use só letras, espaços, hífen ou apóstrofo',
    );
    expect(fixture.nativeElement.textContent).toContain('Telefone inválido');
  });

  it('saves the phone formatted and the name tidied', () => {
    const nameInput = fixture.nativeElement.querySelector(
      '[data-testid="rsvp-name-input"]',
    ) as HTMLInputElement;
    nameInput.value = '  Carlos   Souza ';
    nameInput.dispatchEvent(new Event('input'));

    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();

    expect(close).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Carlos Souza', phone: '(11) 99999-8888' }),
    );
  });
});
