import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SecretSantaRosterCardComponent } from './secret-santa-roster-card.component';

describe('SecretSantaRosterCardComponent', () => {
  let fixture: ComponentFixture<SecretSantaRosterCardComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const editButtons = () => el().querySelectorAll('[data-testid="secret-santa-roster-edit-btn"]');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretSantaRosterCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SecretSantaRosterCardComponent);
    fixture.componentRef.setInput('giftOptions', true);
    fixture.componentRef.setInput('entries', [
      { id: 'rsvp_ana', name: 'Ana', giftOptions: ['Chinelo 39', 'Bíblia'] },
      { id: 'p2', name: 'Tio Zé', giftOptions: [] },
    ]);
    fixture.detectChanges();
  });

  it('shows the rules the organizer typed, and nothing without them', () => {
    const rules = () => fixture.nativeElement.querySelector('[data-testid="secret-santa-rules"]');
    fixture.detectChanges();
    expect(rules()).toBeNull();

    fixture.componentRef.setInput('rules', 'Presente de R$ 80 a R$ 100.\n\nTroca na ceia.');
    fixture.detectChanges();
    expect(rules().textContent).toBe('Presente de R$ 80 a R$ 100.\n\nTroca na ceia.');
  });

  it('lists everyone with their gift ideas, with no pencil for someone else', () => {
    expect(el().textContent).toContain('Chinelo 39');
    expect(el().textContent).toContain('Sem ideias de presente ainda');
    expect(editButtons().length).toBe(0);
  });

  it('puts a pencil on the guest own entries and opens the form to edit them', () => {
    const edits: string[] = [];
    fixture.componentInstance.edit.subscribe((id) => edits.push(id));
    fixture.componentRef.setInput('editableIds', ['rsvp_ana']);
    fixture.detectChanges();
    expect(editButtons().length).toBe(1);
    (editButtons()[0] as HTMLButtonElement).click();
    expect(edits).toEqual(['rsvp_ana']);

    fixture.componentRef.setInput('editing', {
      id: 'rsvp_ana',
      name: 'Ana',
      phone: '',
      giftOptions: ['Chinelo 39', 'Bíblia'],
      joinedBy: 'ana',
    });
    fixture.detectChanges();
    const sheet = document.querySelector('[data-testid="edit-own-santa-sheet"]')!;
    expect(sheet.querySelectorAll('[data-testid="own-santa-gift-item"]').length).toBe(2);
    expect(sheet.querySelector('[data-testid="own-santa-gift-input"]')).not.toBeNull();
  });

  it('locks the name of the guest and their relatives (it follows the profile), not a companion', () => {
    const nameInput = () =>
      document.querySelector(
        '[data-testid="edit-own-santa-sheet"] [data-testid="own-santa-name-input"] input, [data-testid="edit-own-santa-sheet"] input[data-testid="own-santa-name-input"]',
      ) as HTMLInputElement;
    for (const [id, locked] of [
      ['rsvp_ana', true],
      ['rsvp_ana_f_fam1', true],
      ['rsvp_ana_c_soraya', false],
    ] as const) {
      fixture.componentRef.setInput('editing', {
        id,
        name: 'Ana',
        phone: '',
        giftOptions: [],
        joinedBy: 'ana',
      });
      fixture.detectChanges();
      expect(nameInput().readOnly, id).toBe(locked);
    }
  });
});
