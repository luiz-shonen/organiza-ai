import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FamilyMember, FamilyRelationship } from '../../../../core/models';
import { RELATIONSHIP_OPTIONS } from '../../../../core/utils';
import { PersonName, Phone } from '../../../../core/value-objects';
import {
  OrgAutocompleteFieldComponent,
  OrgButtonComponent,
  OrgTextFieldComponent,
} from '../../../../shared/ui';

export interface AddFamilyMemberPayload {
  name: string;
  relationship: FamilyRelationship;
  phone?: string;
}

/**
 * Name, relationship and phone of a family member. The roster uses one to add and
 * another, in a sheet, to edit, so a half-typed new member survives an edit.
 */
@Component({
  selector: 'app-family-member-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgAutocompleteFieldComponent, OrgButtonComponent, OrgTextFieldComponent],
  templateUrl: './family-member-form.component.html',
  styleUrl: './family-member-form.component.scss',
})
export class FamilyMemberFormComponent {
  /** The member being edited; null to add a new one. */
  readonly member = input<FamilyMember | null>(null);
  readonly saving = input(false);
  readonly submitLabel = input('Adicionar familiar');
  /** Shows a cancel button next to submit (the edit sheet). */
  readonly cancelLabel = input<string | null>(null);
  /** Prefix of the test ids, so the add form and the edit sheet stay distinct. */
  readonly testIdPrefix = input('family-member');
  readonly submitted = output<AddFamilyMemberPayload>();
  readonly cancelled = output<void>();

  protected readonly name = signal('');
  /** Null while what is typed in Parentesco matches no option. */
  protected readonly relationship = signal<FamilyRelationship | null>('child');
  protected readonly phone = signal('');
  /** Set on a submit with invalid fields; the errors then follow what is typed. */
  protected readonly showErrors = signal(false);
  protected readonly nameError = computed(() => {
    if (!this.showErrors()) return '';
    if (!this.name().trim()) return 'Informe o nome do familiar';
    return PersonName.validate(this.name()) ?? '';
  });
  protected readonly relationshipError = computed(() =>
    this.showErrors() && !this.relationship() ? 'Escolha um parentesco da lista' : '',
  );
  protected readonly phoneError = computed(() =>
    this.showErrors() ? (Phone.validate(this.phone()) ?? '') : '',
  );
  protected readonly nameMaxLength = PersonName.MAX;
  protected readonly maskPhone = Phone.mask;
  protected readonly relationshipOptions = RELATIONSHIP_OPTIONS;

  constructor() {
    effect(() => this.load(this.member()));
  }

  protected setRelationship(value: string | null): void {
    const option = this.relationshipOptions.find((candidate) => candidate.value === value);
    this.relationship.set(option?.value ?? null);
  }

  protected submit(): void {
    const name = PersonName.create(this.name());
    const relationship = this.relationship();
    if (!name || !relationship || Phone.validate(this.phone())) {
      this.showErrors.set(true);
      return;
    }
    this.submitted.emit({
      name: name.value,
      relationship,
      phone: Phone.create(this.phone())?.formatted,
    });
    if (!this.member()) this.load(null);
  }

  private load(member: FamilyMember | null): void {
    this.name.set(member?.name ?? '');
    this.relationship.set(member?.relationship ?? 'child');
    this.phone.set(Phone.mask(member?.phone ?? ''));
    this.showErrors.set(false);
  }
}
