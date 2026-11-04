import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { PersonName } from '../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgCheckboxComponent,
  OrgExpansionPanelComponent,
  OrgTextFieldComponent,
} from '../../../../shared/ui';

/** Most companions one RSVP may bring, as the rules allow. */
export const MAX_COMPANIONS = 10;

/**
 * "Levar acompanhantes?": the same panel as "Levar familiares?", for people outside the family.
 * The names come from the guest's history (saved on the profile); "Novo acompanhante" adds one,
 * which the page saves to that history, and selects it.
 */
@Component({
  selector: 'app-companion-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgButtonComponent,
    OrgCheckboxComponent,
    OrgExpansionPanelComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './companion-selector.component.html',
  styleUrl: './companion-selector.component.scss',
})
export class CompanionSelectorComponent {
  readonly names = input<readonly string[]>([]);
  readonly selected = input<readonly string[]>([]);

  readonly toggleCompanion = output<string>();
  readonly add = output<string>();

  protected readonly expanded = signal(false);
  protected readonly showForm = signal(false);
  protected readonly newName = signal('');
  protected readonly nameMaxLength = PersonName.MAX;
  private readonly attempted = signal(false);

  protected readonly full = computed(() => this.selected().length >= MAX_COMPANIONS);
  protected readonly summary = computed(() => {
    const count = this.selected().length;
    if (count === 0) return 'Nenhum';
    // Short, so 'Levar acompanhantes?' fits beside it in the narrow drawer.
    return `+${count}`;
  });
  protected readonly nameError = computed(() => {
    if (!this.attempted()) return '';
    const name = this.newName().trim();
    if (!name) return 'Nome é obrigatório';
    if (this.names().some((known) => known.toLowerCase() === name.toLowerCase())) {
      return 'Essa pessoa já está na lista';
    }
    return PersonName.validate(name) ?? '';
  });

  protected isSelected(name: string): boolean {
    return this.selected().includes(name);
  }

  protected onToggle(name: string): void {
    if (!this.isSelected(name) && this.full()) return;
    this.toggleCompanion.emit(name);
  }

  protected submitNew(): void {
    this.attempted.set(true);
    if (this.nameError()) return;
    const name = PersonName.create(this.newName())?.value;
    if (!name) return;
    this.add.emit(name);
    this.cancelNew();
  }

  protected cancelNew(): void {
    this.showForm.set(false);
    this.newName.set('');
    this.attempted.set(false);
  }
}
