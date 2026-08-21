import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackSnackbarComponent } from './feedback-snackbar.component';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let snackBar: { openFromComponent: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBar = { openFromComponent: vi.fn() };
    TestBed.configureTestingModule({
      providers: [FeedbackService, { provide: MatSnackBar, useValue: snackBar }],
    });
    service = TestBed.inject(FeedbackService);
  });

  afterEach(() => {
    document.querySelector('#feedback-focus-origin')?.remove();
  });

  it('publishes a success message through the shared semantic component with its configured duration', () => {
    service.success('Perfil atualizado!', { duration: 4500 });

    expect(snackBar.openFromComponent).toHaveBeenCalledWith(
      FeedbackSnackbarComponent,
      expect.objectContaining({
        data: { variant: 'success', message: 'Perfil atualizado!' },
        duration: 4500,
        panelClass: 'org-feedback-snackbar',
      }),
    );
  });

  it('publishes error and info messages through the same typed component family', () => {
    service.error('Não foi possível salvar.');
    service.info('Sua sessão expira em breve.');

    expect(snackBar.openFromComponent).toHaveBeenNthCalledWith(
      1,
      FeedbackSnackbarComponent,
      expect.objectContaining({ data: { variant: 'error', message: 'Não foi possível salvar.' } }),
    );
    expect(snackBar.openFromComponent).toHaveBeenNthCalledWith(
      2,
      FeedbackSnackbarComponent,
      expect.objectContaining({ data: { variant: 'info', message: 'Sua sessão expira em breve.' } }),
    );
  });

  it('does not move focus while scheduling auto-dismissal for an actionless message', () => {
    const focusOrigin = document.createElement('button');
    focusOrigin.id = 'feedback-focus-origin';
    document.body.append(focusOrigin);
    focusOrigin.focus();

    service.success('Convite enviado.');

    expect(document.activeElement).toBe(focusOrigin);
    expect(snackBar.openFromComponent).toHaveBeenCalledWith(
      FeedbackSnackbarComponent,
      expect.objectContaining({ duration: 3000 }),
    );
  });
});
