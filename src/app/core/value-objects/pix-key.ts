import { Email } from './email';
import { Phone } from './phone';

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

const RANDOM_KEY = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

function checkDigit(digits: string, weights: number[]): number {
  const sum = weights.reduce((total, weight, i) => total + Number(digits[i]) * weight, 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

function isCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const first = checkDigit(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === Number(digits[9]) && second === Number(digits[10]);
}

function isCnpj(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const first = checkDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === Number(digits[12]) && second === Number(digits[13]);
}

/** A Pix key: CPF, CNPJ, e-mail, phone or random key, saved as it was typed (trimmed). */
export class PixKey {
  static readonly INVALID_MESSAGE =
    'Chave Pix inválida. Use CPF, CNPJ, e-mail, celular com DDD ou chave aleatória';

  private constructor(
    readonly value: string,
    readonly type: PixKeyType,
  ) {}

  static validate(raw: string | null | undefined): string | null {
    if ((raw ?? '').trim().length === 0) return null;
    return PixKey.create(raw) ? null : PixKey.INVALID_MESSAGE;
  }

  static create(raw: string | null | undefined): PixKey | null {
    const value = (raw ?? '').trim();
    if (!value) return null;
    if (value.includes('@')) return Email.create(value) ? new PixKey(value, 'email') : null;
    if (RANDOM_KEY.test(value)) return new PixKey(value, 'random');

    // Digits-only keys may carry the usual punctuation: 000.000.000-00, +55 (11) 9...
    if (!/^[\d\s().+/-]+$/.test(value)) return null;
    const digits = value.replace(/\D/g, '');
    if (isCpf(digits)) return new PixKey(value, 'cpf');
    if (isCnpj(digits)) return new PixKey(value, 'cnpj');
    if (Phone.isValid(value)) return new PixKey(value, 'phone');
    return null;
  }
}
