import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgProgressComponent } from './org-progress.component';

describe('OrgProgressComponent', () => {
  it('clamps values to 0 and 100 and exposes progress semantics', async () => {
    await TestBed.configureTestingModule({ imports: [OrgProgressComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgProgressComponent> = TestBed.createComponent(OrgProgressComponent);
    fixture.componentRef.setInput('value', 145);
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progress.getAttribute('aria-valuenow')).toBe('100');

    fixture.componentRef.setInput('value', -20);
    fixture.detectChanges();
    expect(progress.getAttribute('aria-valuenow')).toBe('0');
  });

  it('renders semantic variant with gradient opt-out', async () => {
    await TestBed.configureTestingModule({ imports: [OrgProgressComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgProgressComponent> = TestBed.createComponent(OrgProgressComponent);
    fixture.componentRef.setInput('value', 67);
    fixture.componentRef.setInput('variant', 'success');
    fixture.componentRef.setInput('gradient', false);
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('mat-progress-bar') as HTMLElement;
    expect(progress.classList.contains('org-progress--success')).toBe(true);
    expect(progress.classList.contains('org-progress--gradient')).toBe(false);
  });
});
