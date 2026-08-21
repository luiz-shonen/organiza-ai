import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FeedbackSnackbarComponent,
  type FeedbackSnackbarData,
} from './feedback-snackbar.component';

describe('FeedbackSnackbarComponent', () => {
  afterEach(() => {
    document.documentElement.classList.remove('theme-junina');
  });

  async function render(data: FeedbackSnackbarData): Promise<ComponentFixture<FeedbackSnackbarComponent>> {
    await TestBed.configureTestingModule({
      imports: [FeedbackSnackbarComponent],
      providers: [{ provide: MAT_SNACK_BAR_DATA, useValue: data }],
    }).compileComponents();

    const fixture = TestBed.createComponent(FeedbackSnackbarComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a success message in the shared green status structure', async () => {
    const fixture = await render({ variant: 'success', message: 'Nome atualizado com sucesso!' });
    const snackbar = fixture.nativeElement.querySelector('[data-testid="feedback-snackbar"]') as HTMLElement;
    const icon = fixture.nativeElement.querySelector('mat-icon') as HTMLElement;

    expect(snackbar.classList.contains('feedback-snackbar--success')).toBe(true);
    expect(snackbar.getAttribute('role')).toBe('status');
    expect(snackbar.textContent).toContain('Nome atualizado com sucesso!');
    expect(icon.textContent?.trim()).toBe('check_circle');
  });

  it('keeps an error message on the semantic error surface when a seasonal theme is active', async () => {
    document.documentElement.classList.add('theme-junina');

    const fixture = await render({ variant: 'error', message: 'Não foi possível atualizar o nome.' });
    const snackbar = fixture.nativeElement.querySelector('[data-testid="feedback-snackbar"]') as HTMLElement;
    const icon = fixture.nativeElement.querySelector('mat-icon') as HTMLElement;

    expect(snackbar.classList.contains('feedback-snackbar--error')).toBe(true);
    expect(snackbar.getAttribute('role')).toBe('status');
    expect(snackbar.textContent).toContain('Não foi possível atualizar o nome.');
    expect(icon.textContent?.trim()).toBe('error');
  });
});
