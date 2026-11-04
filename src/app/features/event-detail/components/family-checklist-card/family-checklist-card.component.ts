import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { FamilyChecklistRow } from '../../../../core/models';
import {
  OrgCardHeaderComponent,
  OrgProgressComponent,
  OrgSurfaceComponent,
} from '../../../../shared/ui';
import { FamilyChecklistComponent } from '../../../../shared/components/family-checklist/family-checklist.component';

/** "Checklist da família": what the household brings to this event, with "comprado" checks. */
@Component({
  selector: 'app-family-checklist-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgCardHeaderComponent,
    OrgProgressComponent,
    OrgSurfaceComponent,
    FamilyChecklistComponent,
  ],
  templateUrl: './family-checklist-card.component.html',
  styleUrl: './family-checklist-card.component.scss',
})
export class FamilyChecklistCardComponent {
  public readonly rows = input<readonly FamilyChecklistRow[]>([]);
  public readonly boughtToggle = output<FamilyChecklistRow>();
  public readonly removeRow = output<FamilyChecklistRow>();

  protected readonly bought = computed(() => this.rows().filter((row) => row.bought).length);
  protected readonly percent = computed(() =>
    this.rows().length ? (this.bought() / this.rows().length) * 100 : 0,
  );
}
