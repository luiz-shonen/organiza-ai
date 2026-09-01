import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgIconName } from '../actions/org-icon.component';
import { OrgSectionComponent } from './org-section.component';

@Component({
  imports: [OrgSectionComponent],
  template: `
    <org-section id="minimal-section" title="Simple Section">
      <p id="minimal-body">Body Content</p>
    </org-section>

    <org-section id="full-section" title="Convidados" icon="group_add" [count]="42">
      <button orgSectionActions id="action-btn">Adicionar</button>
      <div id="full-body">Roster list</div>
    </org-section>

    <org-section
      id="dynamic-section"
      [title]="dynamicTitle()"
      [icon]="dynamicIcon()"
      [count]="dynamicCount()"
    >
      <div id="dynamic-body">Dynamic Content</div>
    </org-section>
  `,
})
class SectionTestHostComponent {
  public dynamicTitle = signal<string>('Dynamic Section');
  public dynamicIcon = signal<OrgIconName | undefined>('event');
  public dynamicCount = signal<number | undefined>(0);
}

describe('OrgSectionComponent', () => {
  let fixture: ComponentFixture<SectionTestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionTestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionTestHostComponent);
    fixture.detectChanges();
  });

  it('renders minimal section with h2 title and projected body content', () => {
    const section = fixture.nativeElement.querySelector('#minimal-section') as HTMLElement;
    const titleEl = section.querySelector('h2.org-section__title') as HTMLElement;
    expect(titleEl).toBeTruthy();
    expect(titleEl.textContent?.trim()).toBe('Simple Section');

    const bodyEl = section.querySelector('.org-section__content #minimal-body') as HTMLElement;
    expect(bodyEl).toBeTruthy();
    expect(bodyEl.textContent?.trim()).toBe('Body Content');

    expect(section.querySelector('.org-section__count-badge')).toBeNull();
    expect(section.querySelector('org-icon')).toBeNull();
  });

  it('renders full section with title, icon, count badge, actions, and body', () => {
    const section = fixture.nativeElement.querySelector('#full-section') as HTMLElement;

    const titleEl = section.querySelector('h2.org-section__title') as HTMLElement;
    expect(titleEl.textContent?.trim()).toBe('Convidados');

    const iconEl = section.querySelector('org-icon');
    expect(iconEl).toBeTruthy();

    const badgeEl = section.querySelector('.org-section__count-badge') as HTMLElement;
    expect(badgeEl).toBeTruthy();
    expect(badgeEl.textContent?.trim()).toBe('42');

    const actionBtn = section.querySelector('.org-section__actions #action-btn') as HTMLElement;
    expect(actionBtn).toBeTruthy();
    expect(actionBtn.textContent?.trim()).toBe('Adicionar');

    const bodyEl = section.querySelector('.org-section__content #full-body') as HTMLElement;
    expect(bodyEl).toBeTruthy();
    expect(bodyEl.textContent?.trim()).toBe('Roster list');
  });

  it('handles count of 0 correctly and reacts to signal updates', () => {
    const host = fixture.componentInstance;
    const section = fixture.nativeElement.querySelector('#dynamic-section') as HTMLElement;

    const badgeEl = section.querySelector('.org-section__count-badge') as HTMLElement;
    expect(badgeEl).toBeTruthy();
    expect(badgeEl.textContent?.trim()).toBe('0');

    host.dynamicTitle.set('Nova Seção');
    host.dynamicIcon.set(undefined);
    host.dynamicCount.set(undefined);
    fixture.detectChanges();

    const titleEl = section.querySelector('h2.org-section__title') as HTMLElement;
    expect(titleEl.textContent?.trim()).toBe('Nova Seção');
    expect(section.querySelector('org-icon')).toBeNull();
    expect(section.querySelector('.org-section__count-badge')).toBeNull();
  });
});
