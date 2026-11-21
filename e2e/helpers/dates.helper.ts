/**
 * A year that is always ahead, so dates typed in the event editor ("20/11", "25/12") stay in the
 * future whatever day the suite runs, the CI included (it runs in UTC, a day ahead at night).
 */
export const NEXT_YEAR = new Date().getFullYear() + 1;

/** "25/12" → "25/12/<next year>", as typed in the date fields. */
export function nextYearDate(dayMonth: string): string {
  return `${dayMonth}/${NEXT_YEAR}`;
}
