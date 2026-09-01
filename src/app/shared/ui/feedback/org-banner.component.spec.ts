import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgBannerComponent } from './org-banner.component';

describe('OrgBannerComponent', () => {
  it('renders the supplied message as an alert with the requested semantic variant', async () => {
    await TestBed.configureTestingModule({ imports: [OrgBannerComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgBannerComponent> =
      TestBed.createComponent(OrgBannerComponent);
    fixture.componentRef.setInput('variant', 'error');
    fixture.componentRef.setInput('message', 'Sua conexão foi interrompida.');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[data-testid="org-banner"]') as HTMLElement;

    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.classList.contains('org-banner--error')).toBe(true);
    expect(banner.textContent).toContain('Sua conexão foi interrompida.');
  });

  it('renders an optional shared icon inline with the message', async () => {
    await TestBed.configureTestingModule({ imports: [OrgBannerComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgBannerComponent);
    fixture.componentRef.setInput('message', 'Modo colaborador');
    fixture.componentRef.setInput('icon', 'info');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('org-icon')).toBeTruthy();
  });
});
