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
  options?: Intl.DateTimeFormatOptions,
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
  return date.toLocaleDateString(locale, { month: 'short' }).replace('.', '').toUpperCase();
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

/**
 * Short weekday plus time, e.g. 'dom. · 20:00'. The day and month already
 * appear in the date badge next to it, so they are left out on purpose.
 */
export function formatWeekdayTime(dateStr: string, locale = 'pt-BR'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
  return `${weekday} · ${formatTime(dateStr, locale)}`;
}

/** "2026-12-25" read as that calendar day at local midnight; null when it is not one. */
export function parseDay(day: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day ?? '');
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getMonth() === Number(match[2]) - 1 ? date : null;
}

/** The local calendar day of a date as "2026-12-25". */
export function toDayString(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The last day of an event that runs over several days (local midnight), or null for a
 * one-day event: no end date, or one that is not after the start day.
 */
export function eventLastDay(startIso: string, endDay: string | null | undefined): Date | null {
  const start = new Date(startIso);
  const end = parseDay(endDay);
  if (!end || isNaN(start.getTime())) return null;
  start.setHours(0, 0, 0, 0);
  return end > start ? end : null;
}

/**
 * The days of an event that runs over several days: "23 a 25 de dezembro", "30 de dezembro
 * a 2 de janeiro" ("23 a 25 de dez." when short); '' for a one-day event.
 */
export function formatDaySpan(
  startIso: string,
  endDay: string | null | undefined,
  month: 'long' | 'short' = 'long',
): string {
  const last = eventLastDay(startIso, endDay);
  if (!last) return '';
  const start = new Date(startIso);
  const dayMonth = (date: Date) => date.toLocaleDateString('pt-BR', { day: 'numeric', month });
  const sameMonth =
    start.getMonth() === last.getMonth() && start.getFullYear() === last.getFullYear();
  return sameMonth
    ? `${start.getDate()} a ${dayMonth(last)}`
    : `${dayMonth(start)} a ${dayMonth(last)}`;
}
