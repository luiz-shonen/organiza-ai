import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EventAddressForm } from '../../../../../core/models';
import {
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
}
