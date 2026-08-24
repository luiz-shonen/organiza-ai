import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { OrgIconButtonComponent } from './org-icon-button.component';

describe('OrgIconButtonComponent', () => {
  it('renders its required accessible label, icon and semantic variant', async () => {
    await TestBed.configureTestingModule({ imports: [OrgIconButtonComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgIconButtonComponent> = TestBed.createComponent(OrgIconButtonComponent);
    fixture.componentRef.setInput('ariaLabel', 'Fechar diálogo');
    fixture.componentRef.setInput('icon', 'close');
    fixture.componentRef.setInput('variant', 'primary');
    fixture.componentRef.setInput('gradient', false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Fechar diálogo');
    expect(button.classList.contains('org-icon-button__control--primary')).toBe(true);
    expect(button.classList.contains('org-icon-button__control--gradient')).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('close');
  });

  it('falls back to default and blocks emission while disabled', async () => {
    await TestBed.configureTestingModule({ imports: [OrgIconButtonComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgIconButtonComponent> = TestBed.createComponent(OrgIconButtonComponent);
    const pressed = vi.fn();
    fixture.componentInstance.pressed.subscribe(pressed);
    fixture.componentRef.setInput('ariaLabel', 'Abrir menu');
    fixture.componentRef.setInput('icon', 'menu');
    fixture.componentRef.setInput('variant', 'other' as never);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('click'));

    expect(button.classList.contains('org-icon-button__control--default')).toBe(true);
    expect(button.disabled).toBe(true);
    expect(pressed).not.toHaveBeenCalled();
  });
});
