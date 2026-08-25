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
      const subtitle = compiled.querySelector('.rsvp-card__subtitle');
      expect(subtitle?.textContent).toContain('5 pessoa(s) confirmada(s)');

      const confirmBtn = compiled.querySelector('.rsvp-card__confirm-btn button') as HTMLButtonElement;
      expect(confirmBtn).toBeTruthy();
      expect(confirmBtn.textContent).toContain('Confirmar Presença');
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
      const title = compiled.querySelector('.rsvp-card__title');
      expect(title?.textContent).toContain('Você está na lista!');

      const status = compiled.querySelector('.rsvp-card__status');
      expect(status?.textContent).toContain('Lucas');
      expect(status?.textContent).toContain('Sua presença está confirmada.');
    });

    it('renders cancel button and emits cancelRsvp output when clicked', () => {
      const cancelSpy = vi.fn();
      component.cancelRsvp.subscribe(cancelSpy);

      const cancelBtn = fixture.nativeElement.querySelector(
        '.rsvp-card__cancel-btn button',
      ) as HTMLButtonElement;
      expect(cancelBtn).toBeTruthy();
      cancelBtn.click();

      expect(cancelSpy).toHaveBeenCalledTimes(1);
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
});
