import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgMetricCardComponent } from './org-metric-card.component';

describe('OrgMetricCardComponent', () => {
  it('renders label, value, description and trend on a semantic surface', async () => {
    await TestBed.configureTestingModule({ imports: [OrgMetricCardComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgMetricCardComponent> =
      TestBed.createComponent(OrgMetricCardComponent);
    fixture.componentRef.setInput('label', 'Confirmações');
    fixture.componentRef.setInput('value', '42');
    fixture.componentRef.setInput('description', 'nesta semana');
    fixture.componentRef.setInput('trend', '+18%');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Confirmações');
    expect(fixture.nativeElement.textContent).toContain('42');
    expect(fixture.nativeElement.textContent).toContain('+18%');
    expect(fixture.nativeElement.querySelector('org-surface')).toBeTruthy();
  });

  it('exposes atmosphere and gradient opt-out as typed component inputs', async () => {
    await TestBed.configureTestingModule({ imports: [OrgMetricCardComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgMetricCardComponent> =
      TestBed.createComponent(OrgMetricCardComponent);
    fixture.componentRef.setInput('label', 'Convites');
    fixture.componentRef.setInput('value', '6');
    fixture.componentRef.setInput('atmosphere', true);
    fixture.componentRef.setInput('gradient', false);
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('.org-surface')
        ?.classList.contains('org-surface--atmosphere'),
    ).toBe(true);
    expect(
      fixture.nativeElement
        .querySelector('.org-metric-card')
        ?.classList.contains('org-metric-card--gradient'),
    ).toBe(false);
  });
});
