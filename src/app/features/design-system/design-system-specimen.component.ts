import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrgCardHeaderComponent, OrgSurfaceComponent } from '../../shared/ui';
import { DesignSystemCodeExampleComponent } from './design-system-code-example.component';

/** How the demo lays its content out: a wrapping row, a column, or a responsive grid. */
export type DesignSystemSpecimenLayout = 'row' | 'stack' | 'grid';

/**
 * One entry of the catalog: what the component is, when to use it, a live demo (projected)
 * and the exact snippet that produces it.
 */
@Component({
  selector: 'app-design-system-specimen',
  imports: [DesignSystemCodeExampleComponent, OrgCardHeaderComponent, OrgSurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-specimen.component.html',
  styleUrl: './design-system-specimen.component.scss',
  host: { '[class.ds-specimen--wide]': 'wide()' },
})
export class DesignSystemSpecimenComponent {
  public readonly heading = input.required<string>();
  /** The tags or API it documents, e.g. `<org-button>` or `FeedbackService`. */
  public readonly api = input<string | null>(null);
  public readonly summary = input.required<string>();
  public readonly code = input<string | null>(null);
  public readonly layout = input<DesignSystemSpecimenLayout>('row');
  /** Takes the whole row of the section grid. */
  public readonly wide = input(false);
}
