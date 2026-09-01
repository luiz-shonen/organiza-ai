import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgSurfaceComponent } from './org-surface.component';

describe('OrgSurfaceComponent', () => {
  it('renders one token-driven glass surface ring for the requested variant', async () => {
    await TestBed.configureTestingModule({ imports: [OrgSurfaceComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgSurfaceComponent> =
      TestBed.createComponent(OrgSurfaceComponent);
    fixture.componentRef.setInput('variant', 'panel');
    fixture.detectChanges();

    const surface = fixture.nativeElement.querySelector('section');
    expect(surface.classList.contains('org-surface--panel')).toBe(true);
    expect(surface.getAttribute('data-testid')).toBe('org-surface');
  });

  it('offers an opt-in atmospheric treatment with configurable orb colors', async () => {
    await TestBed.configureTestingModule({ imports: [OrgSurfaceComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgSurfaceComponent> =
      TestBed.createComponent(OrgSurfaceComponent);
    fixture.componentRef.setInput('atmosphere', true);
    fixture.componentRef.setInput('atmospherePrimary', '#ff6b5b');
    fixture.detectChanges();

    const surface = fixture.nativeElement.querySelector('section') as HTMLElement;

    expect(surface.classList.contains('org-surface--atmosphere')).toBe(true);
    expect(surface.style.getPropertyValue('--org-surface-orb-primary')).toBe('#ff6b5b');
  });
});
