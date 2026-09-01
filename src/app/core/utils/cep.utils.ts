/**
 * CEP (Código de Endereçamento Postal) formatting and validation utilities.
 */

/**
 * Strips all non-digit characters from a CEP string.
 */
export function cleanCep(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '');
}

/**
 * Formats a raw CEP string into '00000-000' mask.
 */
export function formatCep(raw: string): string {
  if (!raw) return '';
  const digits = cleanCep(raw);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Validates whether a given string is a valid 8-digit CEP.
 */
export function isValidCep(cep: string): boolean {
  if (!cep) return false;
  const digits = cleanCep(cep);
  return digits.length === 8;
}
