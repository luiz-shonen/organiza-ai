import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { OrgIconComponent, type OrgIconName } from '../actions/org-icon.component';

export type FeedbackVariant = 'success' | 'error' | 'info';

export interface FeedbackSnackbarData {
  readonly message: string;
  readonly variant: FeedbackVariant;
}

const FEEDBACK_ICON: Readonly<Record<FeedbackVariant, OrgIconName>> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

@Component({
  selector: 'org-feedback-snackbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgIconComponent],
  templateUrl: './feedback-snackbar.component.html',
  styleUrl: './feedback-snackbar.component.scss',
})
export class FeedbackSnackbarComponent {
  protected readonly data = inject<FeedbackSnackbarData>(MAT_SNACK_BAR_DATA);
  protected readonly icon = computed(() => FEEDBACK_ICON[this.data.variant]);
}
