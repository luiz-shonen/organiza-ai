import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { FeedbackService } from '../feedback/feedback.service';
import { OrgButtonComponent, OrgButtonVariant } from './org-button.component';

/**
 * Button that copies `value` to the clipboard and confirms it with a toast.
 * Clipboard and toast are generic UI behaviour, so presentational features
 * stay free of injected services.
 */
@Component({
  selector: 'org-copy-button',
  imports: [OrgButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-copy-button.component.html',
  styleUrl: './org-copy-button.component.scss',
})
export class OrgCopyButtonComponent {
  private readonly clipboard = inject(Clipboard);
  private readonly feedback = inject(FeedbackService);

  public readonly value = input.required<string | null>();
  public readonly label = input('Copiar');
  public readonly copiedMessage = input('Copiado!');
  /** Shown when the browser refuses clipboard access (e.g. in-app webviews). */
  public readonly failedMessage = input(
    'Não foi possível copiar. Selecione o texto e copie manualmente.',
  );
  public readonly variant = input<OrgButtonVariant>('primary');
  public readonly gradient = input(true);
  public readonly fullWidth = input(false);
  public readonly copied = output<string>();

  protected copy(): void {
    const value = this.value();
    if (!value) {
      return;
    }

    if (!this.clipboard.copy(value)) {
      this.feedback.error(this.failedMessage(), { duration: 4000 });
      return;
    }

    this.feedback.success(this.copiedMessage(), { duration: 2000 });
    this.copied.emit(value);
  }
}
