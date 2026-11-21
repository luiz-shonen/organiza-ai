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

  it('keeps adding by hand behind a button: guests come in through the invite', () => {
    fixture.detectChanges();
    expect(el().querySelector('app-secret-santa-participant-form')).toBeNull();

    (byTestId('secret-santa-manual-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('app-secret-santa-participant-form')).toBeTruthy();

    (byTestId('secret-santa-manual-close-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('app-secret-santa-participant-form')).toBeNull();
  });

  it('says how many people are still missing for a draw', () => {
    fixture.componentRef.setInput('participants', [
      { name: 'Ana', phone: '', giftOptions: [] },
    ] satisfies SecretSantaParticipantInput[]);
    fixture.detectChanges();
    expect(byTestId('secret-santa-missing')?.textContent).toContain('Faltam');
    expect(byTestId('secret-santa-missing')?.textContent).toContain('2');
  });

  it('adds a confirmed guest with one tap, or all of them', () => {
    const added: SecretSantaParticipantInput[] = [];
    const many: (readonly SecretSantaParticipantInput[])[] = [];
    fixture.componentInstance.add.subscribe((p) => added.push(p));
    fixture.componentInstance.addMany.subscribe((list) => many.push(list));
    fixture.componentRef.setInput('suggestions', [
      { guestId: 'g1', name: 'Jéssica', phone: '(11) 98888-1111' },
      { guestId: 'g2', name: 'Luiz', phone: '' },
    ]);
    fixture.detectChanges();

    const chip = el().querySelector(
      '.santa-step__suggestions org-button button',
    ) as HTMLButtonElement;
    chip.click();
    expect(added).toEqual([
      { name: 'Jéssica', phone: '(11) 98888-1111', giftOptions: [], guestId: 'g1' },
    ]);

    (
      el().querySelector(
        '[data-testid="secret-santa-add-all-btn"] button, button[data-testid="secret-santa-add-all-btn"]',
      ) as HTMLButtonElement
    ).click();
    expect(many[0].map((p) => p.name)).toEqual(['Jéssica', 'Luiz']);
  });

  it('lists participants with their gift option count and lets them be removed', () => {
    const removed: number[] = [];
    fixture.componentInstance.remove.subscribe((i) => removed.push(i));
    fixture.componentRef.setInput('giftOptions', true);
    fixture.componentRef.setInput('participants', [
      { name: 'Ana', phone: '(11) 98888-1111', giftOptions: ['Livro', 'Chinelo'] },
    ]);
    fixture.detectChanges();
    const list = byTestId('secret-santa-participants')!;
    expect(list.textContent).toContain('Ana');
    expect(list.textContent).toContain('2 opções');
    (list.querySelector('[aria-label="Remover Ana"]') as HTMLButtonElement).click();
    expect(removed).toEqual([0]);
  });
});
