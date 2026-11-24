/** "título", "título e hora", "título, descrição e hora". */
export function joinLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`;
}

export { revealFirstInvalid } from '../../../../shared/ui';
