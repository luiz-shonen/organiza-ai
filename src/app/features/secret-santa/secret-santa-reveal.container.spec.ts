import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SecretSantaRevealContainer } from './secret-santa-reveal.container';
import {
  AuthService,
  ConfettiService,
  InboxService,
  SecretSantaService,
} from '../../core/services';
import type { SecretSantaReveal } from '../../core/models';

describe('SecretSantaRevealContainer', () => {
  let fixture: ComponentFixture<SecretSantaRevealContainer>;
  const getReveal = vi.fn();
  const openReveal = vi.fn();
  const markRead = vi.fn();
  const currentUser = vi.fn();
  const confetti = { fireCelebration: vi.fn() };
  const el = () => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string) => el().querySelector(`[data-testid="${id}"]`);

  const reveal: SecretSantaReveal = {
    eventId: 'evt-1',
    eventTitle: 'Natal 2026 da família',
    eventDate: '2026-12-24T20:00:00.000Z',
    giverName: 'Jéssica Melo',
    receiverName: 'Luiz',
    receiverGiftOptions: ['Chinelo, cor verde, tamanho 36'],
    createdAt: '2026-11-16T20:00:00.000Z',
  };

  async function open(token: string): Promise<void> {
    fixture = TestBed.createComponent(SecretSantaRevealContainer);
    fixture.componentRef.setInput('token', token);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    getReveal.mockReset();
    openReveal.mockReset().mockResolvedValue(undefined);
    markRead.mockReset().mockResolvedValue(undefined);
    currentUser.mockReset().mockReturnValue(null);
    confetti.fireCelebration.mockReset();
    await TestBed.configureTestingModule({
      imports: [SecretSantaRevealContainer],
      providers: [
        provideRouter([]),
        { provide: SecretSantaService, useValue: { getReveal, openReveal } },
        { provide: ConfettiService, useValue: confetti },
        { provide: AuthService, useValue: { currentUser, loading: () => false } },
        { provide: InboxService, useValue: { markRead } },
      ],
    }).compileComponents();
  });

  const press = (testId: string) =>
    (
      el().querySelector(
        `[data-testid="${testId}"] button, button[data-testid="${testId}"]`,
      ) as HTMLButtonElement
    ).click();

  /** Opens the link and answers "Sou a Jéssica, mostrar". */
  async function openAsGiver(token: string): Promise<void> {
    await open(token);
    press('secret-santa-confirm-btn');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  it('first says whose link it is, and shows or spends nothing before they confirm', async () => {
    getReveal.mockResolvedValue(reveal);
    await open('tok-1');
    expect(byTestId('secret-santa-confirm')?.textContent).toContain('Este link é de Jéssica Melo');
    expect(byTestId('secret-santa-confirm')?.textContent).toContain(
      'Se você não é Jéssica, não toque no botão',
    );
    expect(byTestId('secret-santa-confirm-btn')?.textContent).toContain('Sou Jéssica, mostrar');
    expect(openReveal).not.toHaveBeenCalled();
    expect(byTestId('secret-santa-receiver')).toBeNull();
    expect(el().textContent).not.toContain('Luiz');
  });

  it('does not ask the giver signed in to their own account', async () => {
    currentUser.mockReturnValue({ uid: 'jessica-uid', isAnonymous: false });
    getReveal.mockResolvedValue({ ...reveal, giverUid: 'jessica-uid' });
    await open('tok-1');
    expect(byTestId('secret-santa-confirm')).toBeNull();
    expect(byTestId('secret-santa-receiver')?.textContent).toContain('Luiz');
  });

  it('says a link of another account is personal, and offers to sign in', async () => {
    getReveal.mockRejectedValue(new Error('Missing or insufficient permissions.'));
    await open('tok-1');
    expect(byTestId('secret-santa-locked')?.textContent).toContain('Este link é pessoal');
    expect(byTestId('secret-santa-sign-in-btn')).not.toBeNull();
    expect(el().textContent).not.toContain('Link não encontrado');

    currentUser.mockReturnValue({ uid: 'other-uid', isAnonymous: false });
    await open('tok-1');
    expect(byTestId('secret-santa-locked')?.textContent).toContain('você entrou com outra conta');
    expect(byTestId('secret-santa-sign-in-btn')).toBeNull();
  });

  it('opening the link celebrates and shows whom they drew, with the gift options below', async () => {
    getReveal.mockResolvedValue(reveal);
    await openAsGiver('tok-1');
    expect(getReveal).toHaveBeenCalledWith('tok-1');
    expect(byTestId('secret-santa-greeting')?.textContent).toContain('Olá, Jéssica!');
    expect(el().textContent).toContain('Natal 2026 da família');
    expect(byTestId('secret-santa-receiver')?.textContent).toContain('Luiz');
    expect(byTestId('secret-santa-gifts')?.textContent).toContain('Chinelo, cor verde, tamanho 36');
    // Each idea can be looked up on Mercado Livre and Amazon, in a new tab.
    const searches = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
        '[data-testid="secret-santa-gift-search"]',
      ),
    );
    expect(searches.map((link) => link.textContent?.trim())).toEqual(['Mercado Livre', 'Amazon']);
    expect(searches[0].href).toContain('lista.mercadolivre.com.br/Chinelo');
    expect(searches[1].href).toContain('amazon.com.br/s?k=Chinelo');
    expect(searches[1].target).toBe('_blank');
    expect(confetti.fireCelebration).toHaveBeenCalledTimes(1);
  });

  it('hides the name when someone is looking, and shows it again with another party', async () => {
    getReveal.mockResolvedValue(reveal);
    await openAsGiver('tok-1');
    press('secret-santa-hide-btn');
    fixture.detectChanges();
    expect(byTestId('secret-santa-receiver')).toBeNull();

    press('secret-santa-reveal-btn');
    fixture.detectChanges();
    expect(byTestId('secret-santa-receiver')?.textContent).toContain('Luiz');
    expect(confetti.fireCelebration).toHaveBeenCalledTimes(2);
  });

  it('explains when the link no longer exists (the draw was redone)', async () => {
    getReveal.mockResolvedValue(null);
    await open('old-token');
    expect(el().textContent).toContain('Link não encontrado');
  });

  it('spends the link on the first visit and warns to write the name down', async () => {
    getReveal.mockResolvedValue(reveal);
    await openAsGiver('tok-1');
    expect(openReveal).toHaveBeenCalledWith('tok-1');
    expect(byTestId('secret-santa-once-warning')?.textContent).toContain(
      'Este link só abre uma vez.',
    );
  });

  it('says the link expired when it was opened before, without the name', async () => {
    getReveal.mockResolvedValue({
      ...reveal,
      receiverName: '',
      receiverGiftOptions: [],
      openedAt: '2026-11-16T23:49:00.000Z',
    });
    await open('tok-1');
    expect(openReveal).not.toHaveBeenCalled();
    expect(byTestId('secret-santa-expired')?.textContent).toContain('Este link já foi aberto');
    expect(byTestId('secret-santa-expired')?.textContent).toContain('peça um novo link');
    expect(byTestId('secret-santa-not-me')?.textContent).toContain(
      'o sorteio precisa ser feito de novo',
    );
    expect(byTestId('secret-santa-greeting')?.textContent).toContain('Olá, Jéssica!');
    expect(byTestId('secret-santa-receiver')).toBeNull();
    expect(confetti.fireCelebration).not.toHaveBeenCalled();
  });

  it('says the link expired when it was opened elsewhere a moment ago', async () => {
    getReveal.mockResolvedValue(reveal);
    openReveal.mockRejectedValue(new Error('Missing or insufficient permissions.'));
    await openAsGiver('tok-1');
    expect(byTestId('secret-santa-expired')).not.toBeNull();
    expect(byTestId('secret-santa-receiver')).toBeNull();
  });

  it('marks the in-app notice of the event as read when a signed-in member opens the link', async () => {
    currentUser.mockReturnValue({ uid: 'jessica-uid', isAnonymous: false });
    getReveal.mockResolvedValue(reveal);
    await openAsGiver('tok-1');
    expect(markRead).toHaveBeenCalledWith('jessica-uid', 'secret-santa_evt-1');
  });

  it('opens the same way for a visitor who is not signed in', async () => {
    getReveal.mockResolvedValue(reveal);
    await openAsGiver('tok-1');
    expect(byTestId('secret-santa-receiver')?.textContent).toContain('Luiz');
    expect(markRead).not.toHaveBeenCalled();
  });
});
