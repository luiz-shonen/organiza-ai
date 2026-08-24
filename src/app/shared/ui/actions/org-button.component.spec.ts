import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { OrgButtonComponent } from './org-button.component';

describe('OrgButtonComponent', () => {
  it('renders the requested semantic variant and an opt-out gradient treatment', async () => {
    await TestBed.configureTestingModule({ imports: [OrgButtonComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgButtonComponent> = TestBed.createComponent(OrgButtonComponent);
    fixture.componentRef.setInput('label', 'Salvar evento');
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.componentRef.setInput('gradient', false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.textContent?.trim()).toBe('Salvar evento');
    expect(button.classList.contains('org-button__control--secondary')).toBe(true);
    expect(button.classList.contains('org-button__control--gradient')).toBe(false);
  });

  it('uses the primary variant when an unsupported variant is provided', async () => {
    await TestBed.configureTestingModule({ imports: [OrgButtonComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgButtonComponent> = TestBed.createComponent(OrgButtonComponent);
    fixture.componentRef.setInput('label', 'Salvar');
    fixture.componentRef.setInput('variant', 'unsupported' as never);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button')?.classList.contains('org-button__control--primary')).toBe(true);
  });

  it('does not emit activation while disabled or loading', async () => {
    await TestBed.configureTestingModule({ imports: [OrgButtonComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgButtonComponent> = TestBed.createComponent(OrgButtonComponent);
    const pressed = vi.fn();
    fixture.componentInstance.pressed.subscribe(pressed);
    fixture.componentRef.setInput('label', 'Salvar');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('click'));
    expect(pressed).not.toHaveBeenCalled();

    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    button.dispatchEvent(new MouseEvent('click'));

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(pressed).not.toHaveBeenCalled();
  });

  it('emits activation from an enabled button and keeps a 48px target', async () => {
    await TestBed.configureTestingModule({ imports: [OrgButtonComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgButtonComponent> = TestBed.createComponent(OrgButtonComponent);
    const pressed = vi.fn();
    fixture.componentInstance.pressed.subscribe(pressed);
    fixture.componentRef.setInput('label', 'Salvar');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(pressed).toHaveBeenCalledOnce();
    expect(button.classList.contains('org-button__control')).toBe(true);
  });
});
