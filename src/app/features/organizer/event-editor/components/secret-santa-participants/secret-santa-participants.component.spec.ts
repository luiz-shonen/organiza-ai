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
    // The ideas fold under the name: "2 ideias de presente", then each one.
    const toggle = byTestId('secret-santa-gifts-toggle') as HTMLButtonElement;
    expect(toggle.textContent).toContain('2 ideias de presente');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(byTestId('secret-santa-gifts')).toBeNull();
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(byTestId('secret-santa-gifts')!.textContent).toContain('Chinelo');
    toggle.click();
    fixture.detectChanges();
    expect(byTestId('secret-santa-gifts')).toBeNull();
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
