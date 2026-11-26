import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  AI_SUGGESTIONS_PER_EVENT,
  EXPECTED_GUESTS_MAX,
  parseExpectedGuests,
  type AiSuggestedItem,
  type AiSuggestionState,
} from '../../../core/models';
import { formatQuantity, suggestedItemKey } from '../../../core/utils';
import {
  OrgBannerComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgIconComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
} from '../../ui';

/**
 * "Sugestões do Organiza AI": what may be missing on the event's list, each with "Adicionar".
 * Shown to organizers once 70% of the expected people confirmed, on the event page and in the
 * editor's "Itens" step. The request runs in the background (`AiSuggestionService`); this card
 * only shows its state and says how many of the event's 3 suggestions are left.
 *
 * With no expected number yet (`expected` null), it asks for it instead: the same
 * `expectedGuests` as "Quantas pessoas você espera?" in the editor, saved by the page.
 */
@Component({
  selector: 'app-ai-suggestion-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgBannerComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgIconComponent,
    OrgSurfaceComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './ai-suggestion-card.component.html',
  styleUrl: './ai-suggestion-card.component.scss',
})
export class AiSuggestionCardComponent {
  public readonly state = input.required<AiSuggestionState>();
  /** Suggestions this event already used (`aiSuggestionsUsed`). */
  public readonly used = input(0);
  public readonly confirmed = input.required<number>();
  /** `expectedGuests`; null asks for it. */
  public readonly expected = input.required<number | null>();
  /** True while the page saves the expected number. */
  public readonly savingExpected = input(false);
  /** Names already on the list: their suggestion shows "Adicionado". */
  public readonly existingNames = input<readonly string[]>([]);
  public readonly generate = output<void>();
  public readonly add = output<AiSuggestedItem>();
  public readonly expectedSave = output<number>();

  protected readonly expectedText = signal('');
  /** Set on a "Salvar" with something that is not 1 to 999; follows the typing afterwards. */
  private readonly triedExpected = signal(false);
  protected readonly expectedError = computed(() =>
    this.triedExpected() && parseExpectedGuests(this.expectedText()) === null
      ? `Digite um número de 1 a ${EXPECTED_GUESTS_MAX}`
      : '',
  );

  protected saveExpected(): void {
    const value = parseExpectedGuests(this.expectedText());
    this.triedExpected.set(true);
    if (value !== null) this.expectedSave.emit(value);
  }

  protected readonly limit = AI_SUGGESTIONS_PER_EVENT;
  protected readonly remaining = computed(() => Math.max(0, this.limit - this.used()));
  protected readonly loading = computed(() => this.state().status === 'loading');
  protected readonly suggestion = computed(() => this.state().suggestion);
  private readonly onList = computed(
    () => new Set(this.existingNames().map((n) => suggestedItemKey({ name: n }))),
  );

  protected readonly remainingText = computed(() => {
    const left = this.remaining();
    if (!left) return `Este evento já usou as ${this.limit} sugestões do Organiza AI.`;
    return left === 1
      ? `Resta 1 de ${this.limit} sugestões para este evento.`
      : `Restam ${left} de ${this.limit} sugestões para este evento.`;
  });

  protected isAdded(item: AiSuggestedItem): boolean {
    return this.onList().has(suggestedItemKey(item));
  }

  protected quantity(item: AiSuggestedItem): string {
    return formatQuantity(item.quantity, item.unit);
  }
}
