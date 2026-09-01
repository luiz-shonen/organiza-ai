/**
 * Identifier generation utilities.
 */

/**
 * Generates a unique identifier string using Web Crypto randomUUID or timestamp fallback.
 * If prefix is supplied, formats as `${prefix}_${id}`.
 */
export function generateId(prefix?: string): string {
  let uniquePart: string;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    uniquePart = crypto.randomUUID();
  } else {
    uniquePart = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }
  return prefix ? `${prefix}_${uniquePart}` : uniquePart;
}

/**
 * Generates a standard notification identifier formatted as `notif_<timestamp>_<random>`.
 */
export function generateNotificationId(): string {
  const rand = Math.random().toString(36).substring(2, 9);
  return `notif_${Date.now()}_${rand}`;
}
