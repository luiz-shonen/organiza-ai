import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgBadgeComponent } from './org-badge.component';

describe('OrgBadgeComponent', () => {
  it('renders a label and optional icon with semantic variant', async () => {
    await TestBed.configureTestingModule({ imports: [OrgBadgeComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgBadgeComponent> = TestBed.createComponent(OrgBadgeComponent);
    fixture.componentRef.setInput('label', 'Novo');
    fixture.componentRef.setInput('icon', 'check_circle');
    fixture.componentRef.setInput('variant', 'success');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.org-badge') as HTMLElement;
    expect(badge.textContent).toContain('Novo');
    expect(badge.classList.contains('org-badge--success')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('check_circle');
  });

  it('supports category variants and normalizes cat- prefix', async () => {
    await TestBed.configureTestingModule({ imports: [OrgBadgeComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgBadgeComponent> = TestBed.createComponent(OrgBadgeComponent);
    fixture.componentRef.setInput('label', 'Festa Junina');
    fixture.componentRef.setInput('variant', 'cat-festa' as never);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.org-badge') as HTMLElement;
    expect(badge.textContent).toContain('Festa Junina');
    expect(badge.classList.contains('org-badge--festa')).toBe(true);
  });

  it('supports secondary variant', async () => {
    await TestBed.configureTestingModule({ imports: [OrgBadgeComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgBadgeComponent> = TestBed.createComponent(OrgBadgeComponent);
    fixture.componentRef.setInput('label', 'Secundário');
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.org-badge') as HTMLElement;
    expect(badge.classList.contains('org-badge--secondary')).toBe(true);
  });
});
