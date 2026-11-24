import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MapLocation, fieldError } from '../../../../../core/value-objects';
import {
  ADDRESS_COMPLEMENT_MAX,
  ADDRESS_DIRECTIONS_MAX,
  AddressFound,
  EventAddressForm,
} from '../../../../../core/models';
import { joinLabels, revealFirstInvalid } from '../step-validation';
import {
  OrgBannerComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgCheckboxComponent,
  OrgIconComponent,
  OrgSurfaceComponent,
  OrgTextareaFieldComponent,
  OrgTextFieldComponent,
} from '../../../../../shared/ui';

@Component({
  selector: 'app-event-address-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OrgBannerComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgCheckboxComponent,
    OrgIconComponent,
    OrgSurfaceComponent,
    OrgTextareaFieldComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './event-address-step.component.html',
  styleUrl: '../event-step.scss',
})
export class EventAddressStepComponent {
  readonly form = input.required<EventAddressForm>();
  /** Which fields the CEP filled; those stay locked. Null until a full CEP was looked up. */
  readonly found = input<AddressFound | null>(null);
  /** "Sem número": ticked, and whether it can be changed (not for collaborators). */
  readonly noNumber = input({ checked: false, disabled: false });
  readonly cepInput = output<string>();
  readonly back = output<void>();
  readonly next = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Set once "Próximo" was pressed with something missing; the message then follows the form. */
  private readonly attempted = signal(false);

  protected readonly fieldError = fieldError;
  protected readonly complementMax = ADDRESS_COMPLEMENT_MAX;
  protected readonly directionsMax = ADDRESS_DIRECTIONS_MAX;

  /**
   * A long link copied from the address bar becomes its pin once the field is left
   * ("Sítio Boa Vista: -19.9167, -43.9345"), so the field stays short and readable.
   */
  protected tidyMapLocation(): void {
    const control = this.form().controls.mapLocation;
    if (control.disabled) return;
    const pin = MapLocation.create(control.value);
    if (pin && pin.text !== control.value.trim() && !('url' in pin.data)) {
      control.setValue(pin.text);
    }
  }

  /** Under "Localização no mapa": what was understood, or how to fill it in. */
  protected mapHint(text: string): string {
    const pin = text.trim() ? MapLocation.create(text) : null;
    return pin
      ? pin.summary
      : 'Cole o link de "Compartilhar" do Google Maps, a localização enviada no WhatsApp ou a latitude e longitude (ex: -19.9167, -43.9345).';
  }

  /** The CEP was found but left something out, as a rural CEP does: say what to do. */
  protected readonly partlyFound = computed(() => {
    const found = this.found();
    return !!found && !(found.address && found.neighborhood && found.city);
  });

  /** Locked: filled by the CEP, or no full CEP yet. Open: the CEP did not bring it. */
  protected isLocked(field: keyof AddressFound): boolean {
    return this.found()?.[field] ?? true;
  }

  /** Moves on when the step is complete; otherwise says what is missing and shows the field. */
  protected tryNext(): void {
    const form = this.form();
    // Not invalid, rather than valid: a collaborator sees these fields locked (disabled), and
    // a disabled form is neither; they still move on through the steps.
    if (!form.invalid) {
      this.attempted.set(false);
      this.next.emit();
      return;
    }
    form.markAllAsTouched();
    this.attempted.set(true);
    setTimeout(() => revealFirstInvalid(this.host.nativeElement));
  }

  /** Why "Próximo" does not move on yet, in plain words. */
  protected missingMessage(): string {
    if (!this.attempted()) return '';
    const form = this.form();
    if (!form.invalid) return '';
    const { cep, number, address, neighborhood, city } = form.controls;
    const missing: string[] = [];
    if (cep.invalid) missing.push('o CEP');
    if (number.invalid) missing.push('o número');
    if (address.invalid && !this.isLocked('address')) missing.push('o endereço');
    if (neighborhood.invalid && !this.isLocked('neighborhood')) missing.push('o bairro');
    if (city.invalid && !this.isLocked('city')) missing.push('a cidade');
    if (missing.length) return `Para continuar, preencha ${joinLabels(missing)}.`;
    if (address.invalid || neighborhood.invalid || city.invalid) {
      return 'Digite o CEP completo para buscarmos o endereço.';
    }
    return 'Para continuar, confira os campos marcados em vermelho.';
  }
}
