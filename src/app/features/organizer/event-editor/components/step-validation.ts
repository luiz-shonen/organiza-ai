/** "título", "título e hora", "título, descrição e hora". */
export function joinLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`;
}

/** Brings the first field with an error into view and focuses it when it takes typing. */
export function revealFirstInvalid(host: HTMLElement): void {
  const field = host.querySelector<HTMLElement>('[formcontrolname].ng-invalid, .event-step__error');
  if (!field) return;
  field.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  field.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true });
}
