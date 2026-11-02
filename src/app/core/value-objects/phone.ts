/**
 * A Brazilian phone number: two-digit DDD plus 8 digits (landline) or 9 digits
 * starting with 9 (mobile). Stored and shown as "(11) 98888-1111".
 */
export class Phone {
  static readonly INVALID_MESSAGE = 'Telefone inválido, ex.: (11) 98888-1111';

  private constructor(readonly digits: string) {}

  /** The valid phone, or null when `raw` is not one. Accepts a leading +55. */
  static create(raw: string | null | undefined): Phone | null {
    let digits = (raw ?? '').replace(/\D/g, '');
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
      digits = digits.slice(2);
    }
    const ddd = Number(digits.slice(0, 2));
    if (ddd < 11) return null;
    if (digits.length === 10 && digits[2] !== '9') return new Phone(digits);
    if (digits.length === 11 && digits[2] === '9') return new Phone(digits);
    return null;
  }

  /** The problem with `raw`, or null when it is valid. Empty text is left to `required`. */
  static validate(raw: string | null | undefined): string | null {
    if ((raw ?? '').trim().length === 0) return null;
    return Phone.isValid(raw) ? null : Phone.INVALID_MESSAGE;
  }

  static isValid(raw: string | null | undefined): boolean {
    return Phone.create(raw) !== null;
  }

  /**
   * Input mask applied while typing: keeps digits only, at most 11, and adds the
   * parentheses, space and hyphen as they become due.
   */
  static mask(raw: string): string {
    const digits = (raw ?? '').replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);
    if (rest.length <= 4) return `(${ddd}) ${rest}`;
    const split = rest.length === 9 ? 5 : 4;
    return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
  }

  /** The formatted number when `raw` is valid; otherwise `raw` as it was saved. */
  static display(raw: string | null | undefined): string {
    return Phone.create(raw)?.formatted ?? raw ?? '';
  }

  get formatted(): string {
    return Phone.mask(this.digits);
  }

  equals(other: Phone | null): boolean {
    return other !== null && other.digits === this.digits;
  }
}
