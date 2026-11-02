import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { FamilyChecklistRow } from '../../../core/models';
import { OrgCheckboxComponent, OrgIconButtonComponent } from '../../ui';

/**
 * What the household brings, one line per person and item, with a "comprado" check.
 * Used in the Início panel and in the event's "Checklist da família" card.
 */
@Component({
  selector: 'app-family-checklist',
  standalone: true,
  imports: [OrgCheckboxComponent, OrgIconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './family-checklist.component.html',
  styleUrl: './family-checklist.component.scss',
})
export class FamilyChecklistComponent {
  public readonly rows = input<readonly FamilyChecklistRow[]>([]);
  /** Shows a remove button per line (event page only). */
  public readonly removable = input(false);
  public readonly boughtToggle = output<FamilyChecklistRow>();
  public readonly removeRow = output<FamilyChecklistRow>();
}
