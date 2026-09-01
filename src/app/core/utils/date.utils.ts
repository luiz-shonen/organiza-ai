/**
 * Pure date formatting utilities.
 */

/**
 * Formats an ISO date string to a localized date string.
 * If dateStr is empty or invalid, returns an empty string.
 */
export function formatDate(
  dateStr: string,
  locale = 'pt-BR',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const defaultOptions: Intl.DateTimeFormatOptions = options ?? {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  return date.toLocaleDateString(locale, defaultOptions);
}

/**
 * Returns a 2-digit day of the month (e.g. '01' to '31').
 * Returns empty string if dateStr is empty or invalid.
 */
export function getDay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.getDate().toString().padStart(2, '0');
}

/**
 * Returns an uppercase short month abbreviation (e.g. 'JAN', 'FEV', 'OUT').
 * Returns empty string if dateStr is empty or invalid.
 */
export function getMonth(dateStr: string, locale = 'pt-BR'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date
    .toLocaleDateString(locale, { month: 'short' })
    .replace('.', '')
    .toUpperCase();
}

/**
 * Extracts formatted time 'HH:mm' from an ISO date string.
 * Returns empty string if dateStr is empty or invalid.
 */
export function formatTime(dateStr: string, locale = 'pt-BR'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
