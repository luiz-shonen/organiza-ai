import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrgLoadingStateComponent } from './org-loading-state.component';

describe('OrgLoadingStateComponent', () => {
  let fixture: ComponentFixture<OrgLoadingStateComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrgLoadingStateComponent);
    fixture.componentRef.setInput('label', 'Carregando eventos...');
    fixture.detectChanges();
  });

  it('announces the loading message as a polite status region', () => {
    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain('Carregando eventos...');
  });

  it('labels the spinner with the same message', () => {
    const spinner = fixture.nativeElement.querySelector('mat-spinner') as HTMLElement;
    expect(spinner.getAttribute('aria-label')).toBe('Carregando eventos...');
  });
});
