import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { OrgChipComponent } from './org-chip.component';

describe('OrgChipComponent', () => {
  it('renders semantic appearance without a gradient when requested', async () => {
    await TestBed.configureTestingModule({ imports: [OrgChipComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgChipComponent> = TestBed.createComponent(OrgChipComponent);
    fixture.componentRef.setInput('label', 'Confirmado');
    fixture.componentRef.setInput('variant', 'success');
    fixture.componentRef.setInput('gradient', false);
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('mat-chip') as HTMLElement;
    expect(chip.textContent?.trim()).toBe('Confirmado');
    expect(chip.classList.contains('org-chip--success')).toBe(true);
    expect(chip.classList.contains('org-chip--gradient')).toBe(false);
  });

  it('renders a static chip by default and only emits selection when explicitly enabled', async () => {
    await TestBed.configureTestingModule({ imports: [OrgChipComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgChipComponent> = TestBed.createComponent(OrgChipComponent);
    const selected = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(selected);
    fixture.componentRef.setInput('label', 'Família');
    fixture.componentRef.setInput('variant', 'other' as never);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const staticChip = fixture.nativeElement.querySelector('mat-chip') as HTMLElement;
    staticChip.dispatchEvent(new MouseEvent('click'));
    expect(fixture.nativeElement.querySelector('mat-chip-option')).toBeNull();
    expect(staticChip.classList.contains('org-chip--default')).toBe(true);
    expect(selected).not.toHaveBeenCalled();

    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('mat-chip-option') as HTMLElement;
    chip.dispatchEvent(new MouseEvent('click'));
    expect(selected).toHaveBeenCalledWith(true);
  });
});
