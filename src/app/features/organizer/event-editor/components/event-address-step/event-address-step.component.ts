import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { fieldError } from '../../../../../core/value-objects';
import { EventAddressForm } from '../../../../../core/models';
import { joinLabels, revealFirstInvalid } from '../step-validation';
import {
  OrgBannerComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgSurfaceComponent,
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
    OrgSurfaceComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './event-address-step.component.html',
  styleUrl: '../event-step.scss',
})
export class EventAddressStepComponent {
  readonly form = input.required<EventAddressForm>();
  readonly cepInput = output<string>();
  readonly back = output<void>();
  readonly next = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Set once "Próximo" was pressed with something missing; the message then follows the form. */
  private readonly attempted = signal(false);

  protected readonly fieldError = fieldError;

  /** Moves on when the step is complete; otherwise says what is missing and shows the field. */
  protected tryNext(): void {
    const form = this.form();
    if (form.valid) {
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
    if (form.valid) return '';
    const { cep, number, address, neighborhood, city } = form.controls;
    const missing: string[] = [];
    if (cep.invalid) missing.push('o CEP');
    if (number.invalid) missing.push('o número');
    if (missing.length) return `Para continuar, preencha ${joinLabels(missing)}.`;
    if (address.invalid || neighborhood.invalid || city.invalid) {
      return 'Não encontramos a rua desse CEP. Confira os números do CEP.';
    }
    return 'Para continuar, confira os campos marcados em vermelho.';
  }
}
