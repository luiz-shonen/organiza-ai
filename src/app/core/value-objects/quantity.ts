/** How many of an item to bring: a whole number from 1 to 999. */
export class Quantity {
  static readonly MIN = 1;
  static readonly MAX = 999;
  static readonly INVALID_MESSAGE = `Use um número inteiro de ${Quantity.MIN} a ${Quantity.MAX}`;

  private constructor(readonly value: number) {}

  static validate(raw: string | number | null | undefined): string | null {
    if (raw === null || raw === undefined || String(raw).trim() === '') return null;
    return Quantity.create(raw) ? null : Quantity.INVALID_MESSAGE;
  }

  /** Input mask applied while typing: digits only, at most three. */
  static mask(raw: string): string {
    return (raw ?? '').replace(/\D/g, '').slice(0, String(Quantity.MAX).length);
  }

  static create(raw: string | number | null | undefined): Quantity | null {
    const text = String(raw ?? '').trim();
    if (!/^\d+$/.test(text)) return null;
    const value = Number(text);
    return value >= Quantity.MIN && value <= Quantity.MAX ? new Quantity(value) : null;
  }
}
