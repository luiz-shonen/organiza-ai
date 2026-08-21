import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgSurfaceComponent } from './org-surface.component';

describe('OrgSurfaceComponent', () => {
  it('renders one token-driven glass surface ring for the requested variant', async () => {
    await TestBed.configureTestingModule({ imports: [OrgSurfaceComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgSurfaceComponent> = TestBed.createComponent(OrgSurfaceComponent);
    fixture.componentRef.setInput('variant', 'panel');
    fixture.detectChanges();

    const surface = fixture.nativeElement.querySelector('section');
    expect(surface.classList.contains('org-surface--panel')).toBe(true);
    expect(surface.getAttribute('data-testid')).toBe('org-surface');
  });
});
