import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Clipboard } from '@angular/cdk/clipboard';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PixCardComponent } from './pix-card.component';

describe('PixCardComponent', () => {
  let component: PixCardComponent;
  let componentRef: ComponentRef<PixCardComponent>;
  let fixture: ComponentFixture<PixCardComponent>;
  let clipboardSpy: { copy: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    clipboardSpy = {
      copy: vi.fn().mockReturnValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [PixCardComponent],
      providers: [{ provide: Clipboard, useValue: clipboardSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(PixCardComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('pixKey', 'user@pix.me');
    fixture.detectChanges();
  });

  it('should create and render the initial pixKey', () => {
    expect(component).toBeTruthy();
    const keyElement = fixture.debugElement.query(By.css('.pix-card__key'));
    expect(keyElement.nativeElement.textContent.trim()).toBe('user@pix.me');
  });

  it('should update rendered pixKey when input signal changes', () => {
    componentRef.setInput('pixKey', 'new-pix-key@bank.com');
    fixture.detectChanges();

    const keyElement = fixture.debugElement.query(By.css('.pix-card__key'));
    expect(keyElement.nativeElement.textContent.trim()).toBe('new-pix-key@bank.com');
  });

  it('should dynamically calculate and render per-person split when estimatedBudget and guestCount are set', () => {
    componentRef.setInput('estimatedBudget', 100);
    componentRef.setInput('guestCount', 4);
    fixture.detectChanges();

    const splitValueEl = fixture.debugElement.query(By.css('.pix-card__split-value'));
    expect(splitValueEl).toBeTruthy();
    expect(splitValueEl.nativeElement.textContent.trim()).toBe('R$ 25.00');

    // Update guest count and verify computed reactivity
    componentRef.setInput('guestCount', 8);
    fixture.detectChanges();

    expect(splitValueEl.nativeElement.textContent.trim()).toBe('R$ 12.50');
  });

  it('should not render split section when budget or guestCount is missing or non-positive', () => {
    componentRef.setInput('estimatedBudget', 100);
    componentRef.setInput('guestCount', 0);
    fixture.detectChanges();

    let splitContainer = fixture.debugElement.query(By.css('.pix-card__split-container'));
    expect(splitContainer).toBeNull();

    componentRef.setInput('estimatedBudget', undefined);
    componentRef.setInput('guestCount', 5);
    fixture.detectChanges();

    splitContainer = fixture.debugElement.query(By.css('.pix-card__split-container'));
    expect(splitContainer).toBeNull();
  });

  it('should copy pixKey to clipboard and emit copyPix output on button click', () => {
    let copyPixEmitted = false;
    let copiedEmitted = false;

    component.copyPix.subscribe(() => {
      copyPixEmitted = true;
    });
    component.copied.subscribe(() => {
      copiedEmitted = true;
    });

    const button = fixture.debugElement.query(By.css('.pix-card__copy-btn'));
    button.nativeElement.click();

    expect(clipboardSpy.copy).toHaveBeenCalledWith('user@pix.me');
    expect(copyPixEmitted).toBe(true);
    expect(copiedEmitted).toBe(true);
  });

  it('should comply with WCAG accessibility requirements', () => {
    const button = fixture.debugElement.query(By.css('.pix-card__copy-btn'));
    expect(button.nativeElement.getAttribute('aria-label')).toBe('Copiar chave Pix');

    const keyElement = fixture.debugElement.query(By.css('.pix-card__key'));
    expect(keyElement.nativeElement.getAttribute('aria-label')).toBe('Chave Pix');
  });
});
