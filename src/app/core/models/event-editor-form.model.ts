import { FormControl, FormGroup } from '@angular/forms';

export type EventBasicInfoForm = FormGroup<{
  title: FormControl<string>;
  category: FormControl<string>;
  description: FormControl<string>;
  date: FormControl<Date | null>;
  time: FormControl<string>;
}>;

export type EventAddressForm = FormGroup<{
  cep: FormControl<string>;
  address: FormControl<string>;
  neighborhood: FormControl<string>;
  city: FormControl<string>;
  number: FormControl<string>;
}>;

export type EventPixForm = FormGroup<{
  pixKey: FormControl<string>;
}>;

export interface NewPartyItem {
  readonly name: string;
  readonly quantity: number;
}
