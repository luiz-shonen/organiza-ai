import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { OrgTooltipComponent } from './org-tooltip.component';

@Component({
  imports: [OrgTooltipComponent],
  template: `<org-tooltip text="Rua das Festas, 123 - Centro"><p>Rua das Festas…</p></org-tooltip>`,
})
class HostComponent {}

describe('OrgTooltipComponent', () => {
  it('shows a Material tooltip with the given text over its content', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const host = fixture.debugElement.query(By.directive(OrgTooltipComponent));
    expect(host.injector.get(MatTooltip).message).toBe('Rua das Festas, 123 - Centro');
    expect((host.nativeElement as HTMLElement).textContent).toContain('Rua das Festas…');
  });
});
