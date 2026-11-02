import { normalizePlainText } from './plain-text';

// Words of letters (accents included) joined by a space, hyphen, apostrophe or dot:
// "Maria da Silva", "Jean-Luc", "D'Ávila", "J. R. Tolkien", "José Jr.".
const NAME_PATTERN = /^[\p{L}\p{M}]+(?:(?:\.? |['’-])[\p{L}\p{M}]+)*\.?$/u;

/** A person's name, for the profile, the family and the guests: 2 to 80 characters. */
export class PersonName {
  static readonly MIN = 2;
  static readonly MAX = 80;

  private constructor(readonly value: string) {}

  /** The problem with `raw`, or null when it is a valid name. Empty text is left to `required`. */
  static validate(raw: string | null | undefined): string | null {
    const name = normalizePlainText(raw);
    if (name.length === 0) return null;
    if (name.length < PersonName.MIN) return `Use pelo menos ${PersonName.MIN} letras`;
    if (name.length > PersonName.MAX) return `Use no máximo ${PersonName.MAX} caracteres`;
    if (!NAME_PATTERN.test(name)) return 'Use só letras, espaços, hífen ou apóstrofo';
    return null;
  }

  /** The tidied name, or null when `raw` is empty or not a valid name. */
  static create(raw: string | null | undefined): PersonName | null {
    const name = normalizePlainText(raw);
    return name && !PersonName.validate(name) ? new PersonName(name) : null;
  }
}
