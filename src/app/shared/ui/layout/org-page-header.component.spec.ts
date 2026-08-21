import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgIconName } from '../actions/org-icon.component';
import { OrgPageHeaderComponent } from './org-page-header.component';

@Component({
  imports: [OrgPageHeaderComponent],
  template: `
    <org-page-header id="minimal-header" title="Minimal Title" />

    <org-page-header
      id="full-header"
      title="Full Featured Title"
      subtitle="This is a descriptive subtitle"
      icon="event"
      [gradient]="true"
    >
      <button orgPageHeaderActions id="action-btn">Criar Evento</button>
    </org-page-header>

    <org-page-header
      id="dynamic-header"
      [title]="dynamicTitle()"
      [subtitle]="dynamicSubtitle()"
      [icon]="dynamicIcon()"
      [gradient]="dynamicGradient()"
    />
  `,
})
class PageHeaderTestHostComponent {
  public dynamicTitle = signal<string>('Dynamic Title');
  public dynamicSubtitle = signal<string | undefined>('Initial Subtitle');
  public dynamicIcon = signal<OrgIconName | undefined>('palette');
  public dynamicGradient = signal<boolean>(false);
}

describe('OrgPageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderTestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderTestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderTestHostComponent);
    fixture.detectChanges();
  });

  it('renders minimal title in an h1 element', () => {
    const header = fixture.nativeElement.querySelector('#minimal-header') as HTMLElement;
    const titleEl = header.querySelector('h1.org-page-header__title') as HTMLElement;
    expect(titleEl).toBeTruthy();
    expect(titleEl.textContent?.trim()).toBe('Minimal Title');
    expect(titleEl.classList.contains('org-gradient-text')).toBe(false);

    const subtitleEl = header.querySelector('.org-page-header__subtitle');
    expect(subtitleEl).toBeNull();

    const iconEl = header.querySelector('org-icon');
    expect(iconEl).toBeNull();
  });

  it('renders full header with title, subtitle, icon, gradient, and projected actions', () => {
    const header = fixture.nativeElement.querySelector('#full-header') as HTMLElement;

    const titleEl = header.querySelector('h1.org-page-header__title') as HTMLElement;
    expect(titleEl.textContent?.trim()).toBe('Full Featured Title');
    expect(titleEl.classList.contains('org-gradient-text')).toBe(true);

    const subtitleEl = header.querySelector('.org-page-header__subtitle') as HTMLElement;
    expect(subtitleEl).toBeTruthy();
    expect(subtitleEl.textContent?.trim()).toBe('This is a descriptive subtitle');

    const iconEl = header.querySelector('.org-page-header__icon-wrap org-icon');
    expect(iconEl).toBeTruthy();

    const actionBtn = header.querySelector('.org-page-header__actions #action-btn') as HTMLElement;
    expect(actionBtn).toBeTruthy();
    expect(actionBtn.textContent?.trim()).toBe('Criar Evento');
  });

  it('updates dynamically when signal inputs change', () => {
    const host = fixture.componentInstance;
    const header = fixture.nativeElement.querySelector('#dynamic-header') as HTMLElement;

    let titleEl = header.querySelector('h1.org-page-header__title') as HTMLElement;
    expect(titleEl.textContent?.trim()).toBe('Dynamic Title');
    expect(titleEl.classList.contains('org-gradient-text')).toBe(false);

    host.dynamicTitle.set('Updated Title');
    host.dynamicGradient.set(true);
    host.dynamicSubtitle.set(undefined);
    host.dynamicIcon.set(undefined);
    fixture.detectChanges();

    titleEl = header.querySelector('h1.org-page-header__title') as HTMLElement;
    expect(titleEl.textContent?.trim()).toBe('Updated Title');
    expect(titleEl.classList.contains('org-gradient-text')).toBe(true);
    expect(header.querySelector('.org-page-header__subtitle')).toBeNull();
    expect(header.querySelector('org-icon')).toBeNull();
  });
});
