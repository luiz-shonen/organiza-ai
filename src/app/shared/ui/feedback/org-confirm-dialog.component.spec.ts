import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
import { OrgConfirmDialogComponent, OrgConfirmDialogData } from './org-confirm-dialog.component';

const DATA: OrgConfirmDialogData = { title: 'Publicar evento', message: 'Deseja publicar este evento agora?', confirmLabel: 'Publicar' };

describe('OrgConfirmDialogComponent', () => {
  it('renders typed dialog data with accessible actions', async () => {
    await TestBed.configureTestingModule({
      imports: [OrgConfirmDialogComponent, MatDialogModule],
      providers: [provideNoopAnimations(), { provide: MAT_DIALOG_DATA, useValue: DATA }, { provide: MatDialogRef, useValue: { close: vi.fn() } }],
    }).compileComponents();
    const fixture: ComponentFixture<OrgConfirmDialogComponent> = TestBed.createComponent(OrgConfirmDialogComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Publicar evento');
    expect(fixture.nativeElement.querySelector('[data-testid="org-confirm-dialog"]')?.getAttribute('role')).toBe('alertdialog');
    const submit = fixture.nativeElement.querySelector('[data-testid="org-confirm-submit"]') as HTMLElement;
    expect(submit.textContent).toContain('Publicar');
    expect(submit.classList.contains('org-button__control--text')).toBe(true);
  });

  it('closes with true for confirm and false for cancel', async () => {
    const close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [OrgConfirmDialogComponent, MatDialogModule],
      providers: [provideNoopAnimations(), { provide: MAT_DIALOG_DATA, useValue: DATA }, { provide: MatDialogRef, useValue: { close } }],
    }).compileComponents();
    const fixture: ComponentFixture<OrgConfirmDialogComponent> = TestBed.createComponent(OrgConfirmDialogComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="org-confirm-cancel"]') as HTMLButtonElement).click();
    expect(close).toHaveBeenCalledWith(false);
    (fixture.nativeElement.querySelector('[data-testid="org-confirm-submit"]') as HTMLButtonElement).click();
    expect(close).toHaveBeenCalledWith(true);
  });
});
