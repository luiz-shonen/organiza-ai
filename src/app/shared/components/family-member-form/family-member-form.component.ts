import { revealFirstInvalidSoon } from '../../ui';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FamilyMember, FamilyRelationship } from '../../../core/models';
import { RELATIONSHIP_OPTIONS, isPet } from '../../../core/utils';
import { PersonName, Phone } from '../../../core/value-objects';
import { OrgAutocompleteFieldComponent, OrgButtonComponent, OrgTextFieldComponent } from '../../ui';

export interface AddFamilyMemberPayload {
  name: string;
  relationship: FamilyRelationship;
  phone?: string;
}

/**
 * Name, relationship and phone of a family member (a pet has no phone). The profile's roster
 * uses one to add and another, in a sheet, to edit, so a half-typed new member survives an
 * edit; the RSVP drawer uses it to add and edit relatives without leaving the event. Not a
 * <form>: inside the RSVP form, a nested submit sent that one too. Enter saves it.
 */
@Component({
  selector: 'app-family-member-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgAutocompleteFieldComponent, OrgButtonComponent, OrgTextFieldComponent],
  templateUrl: './family-member-form.component.html',
  styleUrl: './family-member-form.component.scss',
})
export class FamilyMemberFormComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
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
  /** Pets have no WhatsApp: the field goes away. */
  protected readonly isPet = computed(() => isPet(this.relationship()));
  protected readonly phoneError = computed(() =>
    this.showErrors() && !this.isPet() ? (Phone.validate(this.phone()) ?? '') : '',
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

  /** Enter in a field saves, unless it picked an option of Parentesco. */
  protected onEnter(event: Event): void {
    if (event.defaultPrevented) return;
    event.preventDefault();
    this.submit();
  }

  protected submit(): void {
    const name = PersonName.create(this.name());
    const relationship = this.relationship();
    const pet = isPet(relationship);
    if (!name || !relationship || (!pet && Phone.validate(this.phone()))) {
      this.showErrors.set(true);
      revealFirstInvalidSoon(this.host.nativeElement);
      return;
    }
    this.submitted.emit({
      name: name.value,
      relationship,
      phone: pet ? '' : Phone.create(this.phone())?.formatted,
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
