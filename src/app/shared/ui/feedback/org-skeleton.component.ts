import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type OrgSkeletonShape = 'rect' | 'circle';

/** Pulsing placeholder. The consumer sizes the host (width/height) through its own layout class. */
@Component({
  selector: 'org-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-skeleton.component.html',
  styleUrl: './org-skeleton.component.scss',
  host: {
    'aria-hidden': 'true',
    '[class.org-skeleton--circle]': "shape() === 'circle'",
  },
})
export class OrgSkeletonComponent {
  public readonly shape = input<OrgSkeletonShape>('rect');
}
