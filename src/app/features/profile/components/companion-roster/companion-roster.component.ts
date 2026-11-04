import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { PersonName } from '../../../../core/value-objects';
import {
  OrgAvatarComponent,
  OrgBottomSheetComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgIconButtonComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
} from '../../../../shared/ui';

export interface RenameCompanionPayload {
  from: string;
  to: string;
}

/**
 * "Meus acompanhantes": the people outside the family the member brings, the same history the
 * RSVP's "Levar acompanhantes?" offers. Like "Minha família", the add field is always open and
 * ✏️ renames someone in a side sheet.
 */
@Component({
  selector: 'app-companion-roster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgAvatarComponent,
    OrgBottomSheetComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgIconButtonComponent,
    OrgSurfaceComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './companion-roster.component.html',
  styleUrl: './companion-roster.component.scss',
})
export class CompanionRosterComponent {
  readonly names = input.required<readonly string[]>();
  readonly saving = input(false);

  readonly add = output<string>();
  readonly rename = output<RenameCompanionPayload>();
  readonly remove = output<string>();

  protected readonly nameMaxLength = PersonName.MAX;
  protected readonly newName = signal('');
  private readonly addAttempted = signal(false);
  protected readonly addError = computed(() =>
    this.addAttempted() ? this.problem(this.newName(), null) : '',
  );

  /** The name open in the rename sheet; null while it is closed. */
  protected readonly editing = signal<string | null>(null);
  protected readonly editName = signal('');
  private readonly editAttempted = signal(false);
  protected readonly editError = computed(() =>
    this.editAttempted() ? this.problem(this.editName(), this.editing()) : '',
  );

  protected submitAdd(): void {
    this.addAttempted.set(true);
    const name = PersonName.create(this.newName())?.value;
    if (this.problem(this.newName(), null) || !name) return;
    this.add.emit(name);
    this.newName.set('');
    this.addAttempted.set(false);
  }

  protected startEdit(name: string): void {
    this.editing.set(name);
    this.editName.set(name);
    this.editAttempted.set(false);
  }

  protected saveEdit(): void {
    const from = this.editing();
    this.editAttempted.set(true);
    const to = PersonName.create(this.editName())?.value;
    if (!from || this.problem(this.editName(), from) || !to) return;
    if (to !== from) this.rename.emit({ from, to });
    this.editing.set(null);
  }

  protected onRemove(name: string): void {
    if (this.editing() === name) this.editing.set(null);
    this.remove.emit(name);
  }

  /** Required, a valid name, and not someone already on the list (other than `self`). */
  private problem(raw: string, self: string | null): string {
    const name = raw.trim();
    if (!name) return 'Nome é obrigatório';
    const taken = this.names().some(
      (known) => known !== self && known.toLowerCase() === name.toLowerCase(),
    );
    if (taken) return 'Essa pessoa já está na lista';
    return PersonName.validate(name) ?? '';
  }
}
