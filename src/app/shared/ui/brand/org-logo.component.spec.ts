import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgLogoComponent } from './org-logo.component';

describe('OrgLogoComponent', () => {
  it('draws the calendar mark with its confetti and the wordmark, animated by default', async () => {
    await TestBed.configureTestingModule({ imports: [OrgLogoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgLogoComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.org-logo__check')).toBeTruthy();
    expect(element.querySelectorAll('.org-logo__piece')).toHaveLength(4);
    expect(element.textContent).toContain('Organiza AI');
    expect(element.querySelector('.org-logo--still')).toBeNull();
  });

  it('can be kept still', async () => {
    await TestBed.configureTestingModule({ imports: [OrgLogoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgLogoComponent);
    fixture.componentRef.setInput('animated', false);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.org-logo--still')).toBeTruthy();
  });
});
