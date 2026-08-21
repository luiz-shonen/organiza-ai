import { Directive, input } from '@angular/core';

function normalizeColumns(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return '1fr 1fr';
}

@Directive({
  selector: '[orgFormGrid]',
  standalone: true,
  host: {
    class: 'org-form-grid',
    '[style.--org-form-grid-cols]': 'columns()',
  },
})
export class OrgFormGridDirective {
  /** Desktop grid columns specification (e.g. '1fr 1fr', '2fr 1fr', '1fr 1fr 1fr'). Defaults to '1fr 1fr'. */
  public readonly columns = input<string, string | undefined | null>('1fr 1fr', {
    alias: 'orgFormGrid',
    transform: normalizeColumns,
  });
}
