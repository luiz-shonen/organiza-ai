import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgSegmentedControlComponent } from './org-segmented-control.component';

describe('OrgSegmentedControlComponent', () => {
  it('marks the current value and emits a different choice', async () => {
    await TestBed.configureTestingModule({
      imports: [OrgSegmentedControlComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrgSegmentedControlComponent);
    fixture.componentRef.setInput('ariaLabel', 'Selecionar tema');
    fixture.componentRef.setInput('options', [
      { value: 'light', label: 'Claro', testId: 'opt-light' },
      { value: 'dark', label: 'Escuro', testId: 'opt-dark' },
    ]);
    fixture.componentRef.setInput('value', 'light');
    fixture.detectChanges();

    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));

    const element = fixture.nativeElement as HTMLElement;
    const light = element.querySelector('[data-testid="opt-light"] button') as HTMLButtonElement;
    const dark = element.querySelector('[data-testid="opt-dark"] button') as HTMLButtonElement;
    expect(light.getAttribute('aria-checked')).toBe('true');

    light.click();
    dark.click();
    expect(emitted).toEqual(['dark']);
  });
});
