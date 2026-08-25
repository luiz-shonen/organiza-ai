import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgIconName } from '../actions/org-icon.component';
import { OrgEmptyStateComponent } from './org-empty-state.component';

@Component({
  imports: [OrgEmptyStateComponent],
  template: `
    <org-empty-state id="default-empty" title="Nenhum item cadastrado" />

    <org-empty-state
      id="full-empty"
      title="Nenhum evento encontrado"
      description="Crie seu primeiro evento para começar a organizar suas festas."
      icon="event"
    >
      <button orgEmptyStateAction id="cta-btn">Criar Evento</button>
    </org-empty-state>

    <org-empty-state
      id="dynamic-empty"
      [title]="dynamicTitle()"
      [description]="dynamicDesc()"
      [icon]="dynamicIcon()"
    />
  `,
})
class EmptyStateTestHostComponent {
  public dynamicTitle = signal<string>('Dynamic Title');
  public dynamicDesc = signal<string | undefined>('Initial Description');
  public dynamicIcon = signal<OrgIconName>('search');
}

describe('OrgEmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateTestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateTestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateTestHostComponent);
    fixture.detectChanges();
  });

  it('renders default info icon, title, and glass surface card', () => {
    const el = fixture.nativeElement.querySelector('#default-empty') as HTMLElement;
    const surface = el.querySelector('org-surface .org-surface') as HTMLElement;
    const article = el.querySelector('article.org-empty-state') as HTMLElement;
    expect(article).toBeTruthy();
    expect(surface.classList.contains('org-surface')).toBe(true);
    expect(surface.classList.contains('org-surface--card')).toBe(true);

    const titleEl = el.querySelector('h3.org-empty-state__title') as HTMLElement;
    expect(titleEl.textContent?.trim()).toBe('Nenhum item cadastrado');

    const iconEl = el.querySelector('org-icon');
    expect(iconEl).toBeTruthy();
    expect(el.querySelector('.org-empty-state__description')).toBeNull();
  });

  it('renders full empty state with custom icon, description, and projected CTA action', () => {
    const el = fixture.nativeElement.querySelector('#full-empty') as HTMLElement;

    const titleEl = el.querySelector('h3.org-empty-state__title') as HTMLElement;
    expect(titleEl.textContent?.trim()).toBe('Nenhum evento encontrado');

    const descEl = el.querySelector('.org-empty-state__description') as HTMLElement;
    expect(descEl.textContent?.trim()).toBe('Crie seu primeiro evento para começar a organizar suas festas.');

    const ctaBtn = el.querySelector('.org-empty-state__action #cta-btn') as HTMLElement;
    expect(ctaBtn).toBeTruthy();
    expect(ctaBtn.textContent?.trim()).toBe('Criar Evento');
  });

  it('updates dynamically when signal inputs change', () => {
    const host = fixture.componentInstance;
    const el = fixture.nativeElement.querySelector('#dynamic-empty') as HTMLElement;

    const titleEl = el.querySelector('h3.org-empty-state__title') as HTMLElement;
    expect(titleEl.textContent?.trim()).toBe('Dynamic Title');

    host.dynamicTitle.set('Busca sem resultados');
    host.dynamicDesc.set(undefined);
    host.dynamicIcon.set('error');
    fixture.detectChanges();

    expect(titleEl.textContent?.trim()).toBe('Busca sem resultados');
    expect(el.querySelector('.org-empty-state__description')).toBeNull();
  });
});
