import { inject, Injectable } from '@angular/core';
import { MatSnackBar, type MatSnackBarConfig } from '@angular/material/snack-bar';
import {
  FeedbackSnackbarComponent,
  type FeedbackSnackbarData,
  type FeedbackVariant,
} from './feedback-snackbar.component';

export interface FeedbackOptions {
  readonly duration?: number;
}

const DEFAULT_DURATION = 3000;

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly snackBar = inject(MatSnackBar);

  public success(message: string, options?: FeedbackOptions): void {
    this.publish('success', message, options);
  }

  public error(message: string, options?: FeedbackOptions): void {
    this.publish('error', message, options);
  }

  public info(message: string, options?: FeedbackOptions): void {
    this.publish('info', message, options);
  }

  private publish(variant: FeedbackVariant, message: string, options?: FeedbackOptions): void {
    const data: FeedbackSnackbarData = { variant, message };
    const config: MatSnackBarConfig<FeedbackSnackbarData> = {
      announcementMessage: message,
      data,
      duration: options?.duration ?? DEFAULT_DURATION,
      panelClass: 'org-feedback-snackbar',
      politeness: 'polite',
    };

    this.snackBar.openFromComponent(FeedbackSnackbarComponent, config);
  }
}
