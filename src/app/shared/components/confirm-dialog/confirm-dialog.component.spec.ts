import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogData } from '../../../core/models';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  const defaultData: ConfirmDialogData = {
    title: 'Excluir Item',
    message: 'Tem certeza de que deseja remover este item?',
  };

  const mockDialogRef = {
    close: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, MatDialogModule],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: defaultData },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the dialog and render title and message with default button labels', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;

    const titleEl = compiled.querySelector('.confirm-dialog__title');
    expect(titleEl?.textContent?.trim()).toBe('Excluir Item');

    const messageEl = compiled.querySelector('.confirm-dialog__message');
    expect(messageEl?.textContent?.trim()).toBe('Tem certeza de que deseja remover este item?');

    const cancelBtn = compiled.querySelector('.confirm-dialog__cancel-btn');
    expect(cancelBtn?.textContent?.trim()).toBe('Cancelar');

    const confirmBtn = compiled.querySelector('.confirm-dialog__confirm-btn');
    expect(confirmBtn?.textContent?.trim()).toBe('Confirmar');
  });

  it('should render custom button labels when provided in dialog data', async () => {
    const customData: ConfirmDialogData = {
      title: 'Remover Convidado',
      message: 'Deseja remover este convidado da lista?',
      confirmLabel: 'Sim, remover',
      cancelLabel: 'Manter convidado',
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, MatDialogModule],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: customData },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    const customFixture = TestBed.createComponent(ConfirmDialogComponent);
    customFixture.detectChanges();
    const compiled = customFixture.nativeElement as HTMLElement;

    const cancelBtn = compiled.querySelector('.confirm-dialog__cancel-btn');
    expect(cancelBtn?.textContent?.trim()).toBe('Manter convidado');

    const confirmBtn = compiled.querySelector('.confirm-dialog__confirm-btn');
    expect(confirmBtn?.textContent?.trim()).toBe('Sim, remover');
  });

  it('should trigger dialog close with appropriate values when buttons are clicked', () => {
    const cancelBtn = fixture.nativeElement.querySelector(
      '.confirm-dialog__cancel-btn',
    ) as HTMLButtonElement;
    const confirmBtn = fixture.nativeElement.querySelector(
      '.confirm-dialog__confirm-btn',
    ) as HTMLButtonElement;

    expect(cancelBtn).toBeTruthy();
    expect(confirmBtn).toBeTruthy();

    cancelBtn.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith('');

    mockDialogRef.close.mockClear();
    confirmBtn.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});
