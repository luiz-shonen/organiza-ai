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
});
