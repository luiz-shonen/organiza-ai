import { cleanCep, formatCep } from '../utils/cep.utils';

/** A Brazilian postal code, shown as "00000-000". */
export class Cep {
  static readonly INVALID_MESSAGE = 'CEP inválido, use 00000-000';

  private constructor(readonly digits: string) {}

  static validate(raw: string | null | undefined): string | null {
    const digits = cleanCep(raw ?? '');
    if ((raw ?? '').trim().length === 0) return null;
    return digits.length === 8 && /^[\d\s.-]+$/.test(raw ?? '') ? null : Cep.INVALID_MESSAGE;
  }

  static create(raw: string | null | undefined): Cep | null {
    return raw && !Cep.validate(raw) ? new Cep(cleanCep(raw)) : null;
  }

  /** Input mask applied while typing. */
  static mask(raw: string): string {
    return formatCep(cleanCep(raw ?? '').slice(0, 8));
  }

  get formatted(): string {
    return formatCep(this.digits);
  }
}

const NUMBER_PATTERN = /^(?:\d{1,6}[A-Za-z]?|S\/?N)$/i;

/** The house number in an address: "123", "12A" or "S/N". */
export class AddressNumber {
  static readonly INVALID_MESSAGE = 'Use só números (ex.: 123 ou 12A) ou S/N';

  private constructor(readonly value: string) {}

  static validate(raw: string | null | undefined): string | null {
    const value = (raw ?? '').trim();
    if (value.length === 0) return null;
    return NUMBER_PATTERN.test(value) ? null : AddressNumber.INVALID_MESSAGE;
  }

  static create(raw: string | null | undefined): AddressNumber | null {
    const value = (raw ?? '').trim().toUpperCase();
    if (!value || AddressNumber.validate(value)) return null;
    return new AddressNumber(/^S\/?N$/.test(value) ? 'S/N' : value);
  }
}
