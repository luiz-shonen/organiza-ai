import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

const DAY_MONTH_YEAR = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const DIGITS_ONLY = /^(\d{2})(\d{2})(\d{4})$/;

/** Typing mask for dates: digits only, shown as dd/mm/aaaa. */
export function maskDate(raw: string): string {
  const digits = (raw ?? '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Reads and writes dates as dd/mm/aaaa. The native adapter hands typed text to
 * Date.parse, which reads "02/01/2026" as 1 February and accepts a five-digit year.
 */
@Injectable()
export class OrgDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value !== 'string') return super.parse(value, parseFormat);
    const text = value.trim();
    if (!text) return null;
    const match = DAY_MONTH_YEAR.exec(text) ?? DIGITS_ONLY.exec(text);
    if (!match) return this.invalid();
    const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(year, month - 1, day);
    // new Date rolls 31/02 over into March; a real date keeps its own day and month.
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : this.invalid();
  }

  override format(date: Date, displayFormat: object): string {
    if (!this.isValid(date)) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // Only the text input uses the numeric format; the calendar keeps its own labels.
    const format = displayFormat as Intl.DateTimeFormatOptions;
    return format.day && format.month === 'numeric' && format.year
      ? `${day}/${month}/${date.getFullYear()}`
      : super.format(date, displayFormat);
  }
}
