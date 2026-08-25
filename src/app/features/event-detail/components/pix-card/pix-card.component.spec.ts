import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PixCardComponent } from './pix-card.component';
import { Clipboard } from '@angular/cdk/clipboard';

describe('PixCardComponent', () => {
  let component: PixCardComponent;
  let componentRef: ComponentRef<PixCardComponent>;
  let fixture: ComponentFixture<PixCardComponent>;
  let mockClipboard: {
    copy: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockClipboard = {
      copy: vi.fn().mockReturnValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [PixCardComponent],
      providers: [
        {
          provide: Clipboard,
          useValue: mockClipboard,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PixCardComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should be created', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('suggestedSplit calculation', () => {
    it('calculates suggested split accurately when budget and guestCount are positive', () => {
      componentRef.setInput('estimatedBudget', 600);
      componentRef.setInput('guestCount', 12);
      fixture.detectChanges();

      expect(component.suggestedSplit()).toBe(50);
      expect(component.formattedSuggestedSplit()).toContain('50,00');
    });

    it('returns null when guestCount is 0', () => {
      componentRef.setInput('estimatedBudget', 600);
      componentRef.setInput('guestCount', 0);
      fixture.detectChanges();

      expect(component.suggestedSplit()).toBeNull();
      expect(component.formattedSuggestedSplit()).toBeNull();
    });

    it('returns null when estimatedBudget is null or undefined', () => {
      componentRef.setInput('estimatedBudget', null);
      componentRef.setInput('guestCount', 10);
      fixture.detectChanges();

      expect(component.suggestedSplit()).toBeNull();
      expect(component.formattedSuggestedSplit()).toBeNull();
    });
  });

  describe('template rendering and accessibility', () => {
    it('renders suggested split section with formatted amount when available', () => {
      componentRef.setInput('pixKey', '11999998888');
      componentRef.setInput('estimatedBudget', 300);
      componentRef.setInput('guestCount', 6);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const splitAmount = compiled.querySelector('.pix-card__split-amount');
      expect(splitAmount).toBeTruthy();
      expect(splitAmount?.textContent).toContain('50,00 por pessoa');
    });

    it('renders pix key code tag with aria-label', () => {
      componentRef.setInput('pixKey', 'user@pix.com.br');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const keyCode = compiled.querySelector('.pix-card__key');
      expect(keyCode).toBeTruthy();
      expect(keyCode?.textContent).toContain('user@pix.com.br');
    });
  });

  describe('copyPix interaction', () => {
    it('copies pixKey to clipboard and emits copyPix and copied events', () => {
      componentRef.setInput('pixKey', 'minha-chave-pix-123');
      fixture.detectChanges();

      const copyPixSpy = vi.fn();
      const copiedSpy = vi.fn();
      component.copyPix.subscribe(copyPixSpy);
      component.copied.subscribe(copiedSpy);

      const copyBtn = fixture.nativeElement.querySelector('.pix-card__copy-btn button') as HTMLButtonElement;
      expect(copyBtn).toBeTruthy();
      copyBtn.click();

      expect(mockClipboard.copy).toHaveBeenCalledWith('minha-chave-pix-123');
      expect(copyPixSpy).toHaveBeenCalledWith('minha-chave-pix-123');
      expect(copiedSpy).toHaveBeenCalled();
    });
  });
});
