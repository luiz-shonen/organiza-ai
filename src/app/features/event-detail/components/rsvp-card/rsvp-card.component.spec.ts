import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RsvpCardComponent } from './rsvp-card.component';

describe('RsvpCardComponent', () => {
  let component: RsvpCardComponent;
  let componentRef: ComponentRef<RsvpCardComponent>;
  let fixture: ComponentFixture<RsvpCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RsvpCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RsvpCardComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should be created', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('unconfirmed state', () => {
    beforeEach(() => {
      componentRef.setInput('isConfirmed', false);
      componentRef.setInput('guestCount', 5);
      fixture.detectChanges();
    });

    it('renders unconfirmed CTA button and attendee count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const subtitle = compiled.querySelector('.org-card-header__subheading');
      expect(subtitle?.textContent).toContain('5 pessoas confirmadas');

      const confirmBtn = compiled.querySelector(
        '.rsvp-card__confirm-btn button',
      ) as HTMLButtonElement;
      expect(confirmBtn).toBeTruthy();
      expect(confirmBtn.textContent).toContain('Confirmar presença');
    });

    it('emits confirmRsvp output when CTA button is clicked', () => {
      const confirmSpy = vi.fn();
      component.confirmRsvp.subscribe(confirmSpy);

      const confirmBtn = fixture.nativeElement.querySelector(
        '.rsvp-card__confirm-btn button',
      ) as HTMLButtonElement;
      confirmBtn.click();

      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmed state', () => {
    beforeEach(() => {
      componentRef.setInput('isConfirmed', true);
      componentRef.setInput('guestCount', 10);
      componentRef.setInput('guestName', 'Lucas');
      fixture.detectChanges();
    });

    it('renders confirmed status message and guest name', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('.org-card-header__heading');
      expect(title?.textContent).toContain('Você está na lista!');

      const status = compiled.querySelector('.rsvp-card__text');
      expect(status?.textContent).toContain('Lucas');
      expect(status?.textContent).toContain('sua presença está confirmada.');
    });

    it('asks for an optional message, then emits cancelRsvp with it', () => {
      const cancelSpy = vi.fn();
      component.cancelRsvp.subscribe(cancelSpy);

      const cancelBtn = fixture.nativeElement.querySelector(
        '.rsvp-card__cancel-btn button',
      ) as HTMLButtonElement;
      cancelBtn.click();
      fixture.detectChanges();
      expect(cancelSpy).not.toHaveBeenCalled();

      const textarea = fixture.nativeElement.querySelector(
        '[data-testid="rsvp-decline-form"] textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Vou estar viajando.';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      (
        fixture.nativeElement.querySelector(
          '[data-testid="rsvp-decline-send-btn"] button',
        ) as HTMLButtonElement
      ).click();

      expect(cancelSpy).toHaveBeenCalledWith({ message: 'Vou estar viajando.', santa: null });
    });
  });

  describe('loading state and disabled actions', () => {
    it('disables confirm button and suppresses emissions when isLoading is true', () => {
      componentRef.setInput('isConfirmed', false);
      componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      const confirmSpy = vi.fn();
      component.confirmRsvp.subscribe(confirmSpy);

      const confirmBtn = fixture.nativeElement.querySelector(
        '.rsvp-card__confirm-btn button',
      ) as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(true);

      confirmBtn.click();
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('disables cancel button when isLoading is true during confirmed state', () => {
      componentRef.setInput('isConfirmed', true);
      componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      const cancelSpy = vi.fn();
      component.cancelRsvp.subscribe(cancelSpy);

      const cancelBtn = fixture.nativeElement.querySelector(
        '.rsvp-card__cancel-btn button',
      ) as HTMLButtonElement;
      expect(cancelBtn.disabled).toBe(true);

      cancelBtn.click();
      expect(cancelSpy).not.toHaveBeenCalled();
    });
  });

  describe('answered states', () => {
    const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

    it('stops asking to pick items once the household brings something', () => {
      componentRef.setInput('isConfirmed', true);
      fixture.detectChanges();
      expect(text()).toContain('Escolha abaixo o que vocês vão levar.');

      componentRef.setInput('bringsSomething', true);
      fixture.detectChanges();
      expect(text()).not.toContain('Escolha abaixo');
      expect(text()).toContain('Editar presença');
    });

    it('does not mention items on an event with nothing to bring', () => {
      componentRef.setInput('hasItems', false);
      fixture.detectChanges();
      expect(text()).not.toContain('itens');
    });

    it('offers "Não poderei ir" on a pending invite and emits the decline', () => {
      componentRef.setInput('canDecline', true);
      fixture.detectChanges();
      const spy = vi.fn();
      component.declineRsvp.subscribe(spy);
      (
        fixture.nativeElement.querySelector(
          '[data-testid="rsvp-decline-btn"] button',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      (
        fixture.nativeElement.querySelector(
          '[data-testid="rsvp-decline-send-btn"] button',
        ) as HTMLButtonElement
      ).click();
      expect(spy).toHaveBeenCalledWith({ message: '', santa: null });
    });

    it('shows a declined invite with a way back', () => {
      componentRef.setInput('isDeclined', true);
      componentRef.setInput('canDecline', true);
      fixture.detectChanges();
      expect(text()).toContain('Você recusou este convite');
      expect(text()).toContain('Confirmar presença');
      expect(fixture.nativeElement.querySelector('[data-testid="rsvp-decline-btn"]')).toBeNull();
    });
  });

  describe('amigo oculto', () => {
    const santa = {
      open: true,
      giftOptions: true,
      maxGiftOptions: 3,
      joined: {} as Record<string, readonly string[]>,
    };
    const el = () => fixture.nativeElement as HTMLElement;
    const click = (testId: string) =>
      (
        el().querySelector(
          `[data-testid="${testId}"] button, button[data-testid="${testId}"]`,
        ) as HTMLButtonElement
      ).click();
    const type = (selector: string, value: string) => {
      const field = el().querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
      field.value = value;
      field.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    it('lets someone who is not going stay in the draw, with phone and gift options', () => {
      componentRef.setInput('canDecline', true);
      componentRef.setInput('secretSanta', santa);
      componentRef.setInput('phone', '(11) 98888-1111');
      fixture.detectChanges();
      const spy = vi.fn();
      component.declineRsvp.subscribe(spy);

      click('rsvp-decline-btn');
      fixture.detectChanges();
      (el().querySelector('[data-testid="rsvp-decline-santa"] input') as HTMLInputElement).click();
      fixture.detectChanges();
      expect(
        (el().querySelector('input[data-testid="rsvp-santa-phone"]') as HTMLInputElement).value,
      ).toBe('(11) 98888-1111');
      type('textarea[data-testid="rsvp-santa-gifts"]', 'Livro\n\nMeia azul');
      click('rsvp-decline-send-btn');

      expect(spy).toHaveBeenCalledWith({
        message: '',
        santa: { phone: '(11) 98888-1111', gifts: ['Livro', 'Meia azul'] },
      });
    });

    it('asks for the phone before joining without going', () => {
      componentRef.setInput('isDeclined', true);
      componentRef.setInput('secretSanta', santa);
      fixture.detectChanges();
      const spy = vi.fn();
      component.joinSanta.subscribe(spy);

      click('rsvp-santa-join-btn');
      fixture.detectChanges();
      click('rsvp-santa-join-send-btn');
      fixture.detectChanges();
      expect(spy).not.toHaveBeenCalled();
      expect(el().textContent).toContain('Informe o telefone que vai receber o link');

      type('input[data-testid="rsvp-santa-phone"]', '11977776666');
      click('rsvp-santa-join-send-btn');
      expect(spy).toHaveBeenCalledWith({ phone: '(11) 97777-6666', gifts: [] });
    });

    it('shows a declined member in the draw, with a way out', () => {
      componentRef.setInput('isDeclined', true);
      componentRef.setInput('secretSanta', { ...santa, joined: { self: ['Livro'] } });
      fixture.detectChanges();
      const spy = vi.fn();
      component.leaveSanta.subscribe(spy);

      expect(el().textContent).toContain('Você está no amigo oculto, mesmo sem ir.');
      click('rsvp-santa-leave-btn');
      expect(spy).toHaveBeenCalled();
    });

    it('says where a confirmed member stands, and offers nothing when sign-ups are closed', () => {
      componentRef.setInput('isConfirmed', true);
      componentRef.setInput('secretSanta', { ...santa, open: false });
      fixture.detectChanges();
      expect(el().textContent).toContain('Você não está no amigo oculto.');

      componentRef.setInput('isConfirmed', false);
      componentRef.setInput('isDeclined', true);
      fixture.detectChanges();
      expect(el().querySelector('[data-testid="rsvp-santa-join-btn"]')).toBeNull();
    });
  });

  it('says a confirmation is waiting for the organizer, still with a way to change it', () => {
    componentRef.setInput('isConfirmed', true);
    componentRef.setInput('pendingApproval', true);
    componentRef.setInput('hasItems', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Aguardando aprovação');
    expect(el.querySelector('[data-testid="rsvp-pending-approval"]')?.textContent).toContain(
      'você entra na lista e pode escolher o que levar.',
    );
    expect(el.querySelector('[data-testid="rsvp-edit-btn"]')).not.toBeNull();
    expect(el.textContent).not.toContain('Você está na lista!');
  });
});
