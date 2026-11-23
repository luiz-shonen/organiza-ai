import { FormControl, FormGroup } from '@angular/forms';

export type EventBasicInfoForm = FormGroup<{
  title: FormControl<string>;
  category: FormControl<string>;
  description: FormControl<string>;
  date: FormControl<Date | null>;
  /** "Data de término (opcional)": the last day of an event that runs over several days. */
  endDate: FormControl<Date | null>;
  time: FormControl<string>;
}>;

export type EventAddressForm = FormGroup<{
  cep: FormControl<string>;
  address: FormControl<string>;
  neighborhood: FormControl<string>;
  city: FormControl<string>;
  number: FormControl<string>;
  /** "Sem número": the number reads S/N and cannot be typed. */
  noNumber: FormControl<boolean>;
  complement: FormControl<string>;
  directions: FormControl<string>;
}>;

/**
 * Which address fields the CEP lookup filled. Those stay locked; the others (a rural CEP has
 * no street, often no neighbourhood) are typed by the organizer. Null until a full CEP is known.
 */
export type AddressFound = Readonly<{ address: boolean; neighborhood: boolean; city: boolean }>;

export type EventPixForm = FormGroup<{
  pixKey: FormControl<string>;
  pixPurpose: FormControl<string>;
}>;

export interface NewPartyItem {
  readonly name: string;
  readonly quantity: number;
  readonly unit?: string;
  readonly fixedQuantity?: boolean;
}
