/**
 * Shared rules for free text typed by people (titles, descriptions, item names).
 * Angular already escapes what it renders; these rules keep the stored text tidy
 * and refuse markup and control characters, so nothing that looks like code is saved.
 */
export interface PlainTextRules {
  readonly min: number;
  readonly max: number;
  /** Keeps line breaks (descriptions); otherwise every run of whitespace becomes one space. */
  readonly multiline?: boolean;
}

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MARKUP = /[<>{}]/;
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** Trims, drops control characters and collapses repeated spaces. */
export function normalizePlainText(raw: string | null | undefined, multiline = false): string {
  const text = (raw ?? '').normalize('NFC').replace(CONTROL_CHARS, '');
  if (!multiline) return text.replace(/\s+/g, ' ').trim();
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** The problem with `raw`, or null when it follows the rules. Empty text is left to `required`. */
export function validatePlainText(
  raw: string | null | undefined,
  rules: PlainTextRules,
): string | null {
  const text = normalizePlainText(raw, rules.multiline);
  if (text.length === 0) return null;
  if (MARKUP.test(text)) return 'Não use os caracteres < > { }';
  if (!LETTER_OR_DIGIT.test(text)) return 'Use letras ou números';
  if (text.length < rules.min) return `Use pelo menos ${rules.min} caracteres`;
  if (text.length > rules.max) return `Use no máximo ${rules.max} caracteres`;
  return null;
}
