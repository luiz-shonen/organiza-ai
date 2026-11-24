import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SecretSantaParticipantsComponent } from './secret-santa-participants.component';
import type { SecretSantaParticipantInput } from '../../../../../core/models';

describe('SecretSantaParticipantsComponent', () => {
  let fixture: ComponentFixture<SecretSantaParticipantsComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string) => el().querySelector(`[data-testid="${id}"]`);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretSantaParticipantsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SecretSantaParticipantsComponent);
    fixture.detectChanges();
  });

  it('adds by hand in a drawer (a bottom sheet on a phone), behind a button', () => {
    fixture.detectChanges();
    const form = () =>
      document.querySelector(
        '[data-testid="add-participant-sheet"] app-secret-santa-participant-form',
      );
    expect(form()).toBeNull();

    (byTestId('secret-santa-manual-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(form()).toBeTruthy();

    (document.querySelector('[data-testid="santa-cancel-btn"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(form()).toBeNull();
  });

  it('lets the organizer join their own draw with the name of their profile, locked', async () => {
    const saved: SecretSantaParticipantInput[] = [];
    fixture.componentRef.setInput('self', { uid: 'owner', name: 'Luiz', phone: '(31) 99267-7624' });
    fixture.componentRef.setInput('saveNew', async (p: SecretSantaParticipantInput) => {
      saved.push(p);
      return true;
    });
    fixture.detectChanges();

    (byTestId('secret-santa-self-join-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const sheet = document.querySelector('[data-testid="add-participant-sheet"]')!;
    // The name of the profile is shown, not typed.
    expect(sheet.querySelector('[data-testid="santa-name"]')?.textContent).toContain('Luiz');
    expect(sheet.querySelector('[data-testid="santa-name-input"]')).toBeNull();

    (
      document.querySelector(
        '[data-testid="add-participant-sheet"] [data-testid="santa-submit-btn"] button, [data-testid="add-participant-sheet"] button[type="submit"]',
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    expect(saved).toEqual([
      { name: 'Luiz', phone: '(31) 99267-7624', giftOptions: [], guestId: 'owner' },
    ]);

    fixture.componentRef.setInput('participants', [
      { id: 'p1', name: 'Luiz', phone: '', giftOptions: [], guestId: 'owner' },
    ]);
    fixture.detectChanges();
    expect(byTestId('secret-santa-self-join-btn')).toBeNull();
    expect(byTestId('secret-santa-self')).toBeTruthy();
    expect(byTestId('secret-santa-self-edit-btn')).toBeTruthy();
  });

  it('says how many people are still missing for a draw', () => {
    fixture.componentRef.setInput('participants', [
      { name: 'Ana', phone: '', giftOptions: [] },
    ] satisfies SecretSantaParticipantInput[]);
    fixture.detectChanges();
    expect(byTestId('secret-santa-missing')?.textContent).toContain('Faltam');
    expect(byTestId('secret-santa-missing')?.textContent).toContain('2');
  });

  it('never offers confirmed guests to add: they join from the invite themselves', () => {
    expect(el().textContent).not.toContain('Confirmados no evento');
    expect(byTestId('secret-santa-suggestions')).toBeNull();
    expect(byTestId('secret-santa-manual-btn')).not.toBeNull();
  });

  it('lists participants with their gift ideas and lets them be removed', () => {
    const removed: number[] = [];
    fixture.componentInstance.remove.subscribe((i) => removed.push(i));
    fixture.componentRef.setInput('giftOptions', true);
    fixture.componentRef.setInput('participants', [
      { name: 'Ana', phone: '(11) 98888-1111', giftOptions: ['Livro', 'Chinelo'] },
    ]);
    fixture.detectChanges();
    const list = byTestId('secret-santa-participants')!;
    expect(list.textContent).toContain('Ana');
    // Folded under the name; opened, the same cards the form shows, with nothing to press.
    expect(list.querySelectorAll('[data-testid="gift-options-list-item"]')).toHaveLength(0);
    (
      list.querySelector(
        '[data-testid="gift-options-list-toggle"] button, button[data-testid="gift-options-list-toggle"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    const cards = list.querySelectorAll('[data-testid="gift-options-list-item"]');
    expect([...cards].map((card) => card.textContent?.trim())).toEqual(['Livro', 'Chinelo']);
    expect(byTestId('secret-santa-gifts')!.querySelectorAll('.gift-list button')).toHaveLength(0);
    (list.querySelector('[aria-label="Remover Ana"]') as HTMLButtonElement).click();
    expect(removed).toEqual([0]);
  });

  it('never offers to edit a guest entry: only to take it out', () => {
    fixture.componentRef.setInput('participants', [
      { name: 'Ana', phone: '(11) 98888-1111', giftOptions: ['Livro'], joinedBy: 'ana-uid' },
      { name: 'Bia', phone: '', giftOptions: [], guestId: 'bia-uid' },
      { name: 'Tio Zé', phone: '', giftOptions: [] },
    ]);
    fixture.detectChanges();
    expect(el().querySelector('[aria-label="Editar Ana"]')).toBeNull();
    expect(el().querySelector('[aria-label="Editar Bia"]')).toBeNull();
    expect(el().querySelectorAll('[data-testid="secret-santa-from-invite"]').length).toBe(2);
    expect(el().querySelector('[aria-label="Remover Ana"]')).not.toBeNull();
    // Someone typed by hand is the organizers' to change.
    expect(el().querySelector('[aria-label="Editar Tio Zé"]')).not.toBeNull();
  });
});
