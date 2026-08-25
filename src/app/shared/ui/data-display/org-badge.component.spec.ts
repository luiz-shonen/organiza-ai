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

  it('falls back to default and allows no gradient treatment', async () => {
    await TestBed.configureTestingModule({ imports: [OrgBadgeComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgBadgeComponent> = TestBed.createComponent(OrgBadgeComponent);
    fixture.componentRef.setInput('label', '6');
    fixture.componentRef.setInput('variant', 'other' as never);
    fixture.componentRef.setInput('gradient', false);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.org-badge') as HTMLElement;
    expect(badge.classList.contains('org-badge--default')).toBe(true);
    expect(badge.classList.contains('org-badge--gradient')).toBe(false);
  });
});
