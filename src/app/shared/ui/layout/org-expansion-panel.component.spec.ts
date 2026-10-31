import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrgExpansionPanelComponent } from './org-expansion-panel.component';

@Component({
  imports: [OrgExpansionPanelComponent],
  template: `
    <org-expansion-panel heading="Família" icon="diversity_3" [(expanded)]="open">
      <span orgExpansionSummary>2 selecionados</span>
      <p class="body">Conteúdo</p>
    </org-expansion-panel>
  `,
})
class HostComponent {
  public readonly open = signal(false);
}

describe('OrgExpansionPanelComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders the heading and the projected summary in the header', () => {
    const header = fixture.nativeElement.querySelector('mat-expansion-panel-header') as HTMLElement;
    expect(header.textContent).toContain('Família');
    expect(header.textContent).toContain('2 selecionados');
  });

  it('syncs the expanded model when the header is toggled', () => {
    const header = fixture.nativeElement.querySelector('mat-expansion-panel-header') as HTMLElement;
    header.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);
  });
});
