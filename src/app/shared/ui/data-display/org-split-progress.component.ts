import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface OrgSplitSegment {
  readonly label: string;
  readonly value: number;
}

export type OrgSplitProgressSize = 'sm' | 'md';

/**
 * Goal-gradient bar split by person: each segment is one contributor in a shade of
 * leaf green, with a matching dot in the optional legend below.
 */
@Component({
  selector: 'org-split-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-split-progress.component.html',
  styleUrl: './org-split-progress.component.scss',
})
export class OrgSplitProgressComponent {
  public readonly segments = input<readonly OrgSplitSegment[]>([]);
  public readonly total = input.required<number>();
  public readonly showLegend = input(true);
  public readonly size = input<OrgSplitProgressSize>('sm');
  public readonly muted = input(false);
  public readonly ariaLabel = input('Progresso');

  protected readonly filled = computed(() =>
    Math.min(
      this.total(),
      this.segments().reduce((sum, segment) => sum + segment.value, 0),
    ),
  );

  protected readonly bars = computed(() => {
    const total = Math.max(1, this.total());
    let left = this.total();
    return this.segments()
      .map((segment, index) => {
        const value = Math.max(0, Math.min(segment.value, left));
        left -= value;
        return { tone: index % 4, width: (value / total) * 100 };
      })
      .filter((bar) => bar.width > 0);
  });
}
