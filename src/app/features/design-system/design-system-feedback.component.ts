import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  OrgBannerComponent,
  OrgBottomSheetComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgEmptyStateComponent,
  OrgInsightCardComponent,
  OrgLoadingStateComponent,
  OrgQuantityStepperComponent,
  OrgSectionComponent,
  OrgSkeletonComponent,
  OrgTextFieldComponent,
  OrgTooltipComponent,
  type FeedbackVariant,
} from '../../shared/ui';
import { DS_SNIPPETS } from './design-system-snippets';
import { DesignSystemSpecimenComponent } from './design-system-specimen.component';

/** Which confirmation the page opens through `OrgDialogService`. */
export type DesignSystemDialogDemo = 'danger' | 'choice';

/**
 * "Feedback" of the catalog. Toasts and dialogs are services, so this component only asks the
 * page to open them; sheets and banners are local demo state.
 */
@Component({
  selector: 'app-design-system-feedback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DesignSystemSpecimenComponent,
    OrgBannerComponent,
    OrgBottomSheetComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgEmptyStateComponent,
    OrgInsightCardComponent,
    OrgLoadingStateComponent,
    OrgQuantityStepperComponent,
    OrgSectionComponent,
    OrgSkeletonComponent,
    OrgTextFieldComponent,
    OrgTooltipComponent,
  ],
  templateUrl: './design-system-feedback.component.html',
  styleUrl: './design-system-feedback.component.scss',
})
export class DesignSystemFeedbackComponent {
  /** What the last dialog answered, as the page reports it. */
  public readonly dialogAnswer = input<string | null>(null);
  public readonly toastRequested = output<FeedbackVariant>();
  public readonly dialogRequested = output<DesignSystemDialogDemo>();

  protected readonly snippets = DS_SNIPPETS;
  protected readonly bannerVisible = signal(true);
  protected readonly undone = signal(false);
  protected readonly sheet = signal<'center' | 'side' | null>(null);
  protected readonly quantity = signal(1);
  protected readonly itemName = signal('Bolo de milho');
  protected readonly longPlace =
    'Chácara Santa Rita, Estrada do Sol, 120 — Bairro do Limoeiro, Atibaia (SP)';

  protected closeSheet(): void {
    this.sheet.set(null);
  }
}
