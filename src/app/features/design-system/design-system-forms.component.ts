import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Phone } from '../../core/value-objects/phone';
import {
  OrgAutocompleteFieldComponent,
  OrgCheckboxComponent,
  OrgDateFieldComponent,
  OrgQuantityStepperComponent,
  OrgRadioGroupComponent,
  OrgSectionComponent,
  OrgSegmentedControlComponent,
  OrgSelectFieldComponent,
  OrgTextareaFieldComponent,
  OrgTextFieldComponent,
  OrgTimeFieldComponent,
  OrgToggleComponent,
  type OrgRadioOption,
  type OrgSegmentedOption,
  type OrgSelectOption,
  type OrgTimeOption,
} from '../../shared/ui';
import { DS_SNIPPETS } from './design-system-snippets';
import { DesignSystemSpecimenComponent } from './design-system-specimen.component';

/** "Campos" and "Seleção" of the catalog. Demo state only; no data. */
@Component({
  selector: 'app-design-system-forms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DesignSystemSpecimenComponent,
    OrgAutocompleteFieldComponent,
    OrgCheckboxComponent,
    OrgDateFieldComponent,
    OrgQuantityStepperComponent,
    OrgRadioGroupComponent,
    OrgSectionComponent,
    OrgSegmentedControlComponent,
    OrgSelectFieldComponent,
    OrgTextareaFieldComponent,
    OrgTextFieldComponent,
    OrgTimeFieldComponent,
    OrgToggleComponent,
  ],
  templateUrl: './design-system-forms.component.html',
  styleUrl: './design-system-forms.component.scss',
})
export class DesignSystemFormsComponent {
  protected readonly snippets = DS_SNIPPETS;
  protected readonly maskPhone = Phone.mask;
  protected readonly today = new Date();

  protected readonly eventTitle = signal('Arraiá no jardim');
  protected readonly phone = signal('');
  protected readonly note = signal('Traga uma roupa xadrez!');
  protected readonly format = signal<string | null>('presencial');
  protected readonly category = signal<string | null>('festa-junina');
  protected readonly date = signal<Date | null>(null);
  protected readonly time = signal('19:30');
  protected readonly quantity = signal(2);

  protected readonly reminder = signal(true);
  protected readonly companion = signal(false);
  protected readonly kids = signal(true);
  protected readonly channel = signal<string | null>('whatsapp');
  protected readonly mode = signal('light');

  protected readonly formatOptions: readonly OrgSelectOption[] = [
    { value: 'presencial', label: 'Presencial' },
    { value: 'online', label: 'Online' },
    { value: 'hibrido', label: 'Híbrido' },
  ];

  protected readonly categoryOptions: readonly OrgSelectOption[] = [
    { value: 'aniversario', label: 'Aniversário' },
    { value: 'casamento', label: 'Casamento' },
    { value: 'churrasco', label: 'Churrasco' },
    { value: 'confraternizacao', label: 'Confraternização' },
    { value: 'festa-junina', label: 'Festa Junina' },
    { value: 'formatura', label: 'Formatura' },
    { value: 'natal', label: 'Natal' },
  ];

  protected readonly timeOptions: readonly OrgTimeOption[] = [
    { label: 'Almoço, 12h', value: '12:00' },
    { label: 'Tarde, 16h', value: '16:00' },
    { label: 'Jantar, 19h30', value: '19:30' },
  ];

  protected readonly channelOptions: readonly OrgRadioOption[] = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'E-mail' },
    { value: 'push', label: 'Aviso no celular' },
  ];

  protected readonly modeOptions: readonly OrgSegmentedOption[] = [
    { value: 'light', label: 'Claro', icon: 'light_mode' },
    { value: 'dark', label: 'Escuro', icon: 'dark_mode' },
    { value: 'system', label: 'Sistema', icon: 'brightness_auto' },
  ];
}
