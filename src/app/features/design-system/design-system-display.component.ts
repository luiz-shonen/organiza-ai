import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  OrgAvatarComponent,
  OrgBadgeComponent,
  OrgDataTableComponent,
  OrgDateBadgeComponent,
  OrgIconButtonComponent,
  OrgLogoComponent,
  OrgMetricCardComponent,
  OrgPartyDriftComponent,
  OrgProgressComponent,
  OrgSectionComponent,
  OrgSplitProgressComponent,
  type OrgDataColumn,
  type OrgSplitSegment,
} from '../../shared/ui';
import { DS_SNIPPETS } from './design-system-snippets';
import { DesignSystemSpecimenComponent } from './design-system-specimen.component';

interface DemoItemRow {
  readonly name: string;
  readonly who: string;
  readonly status: string;
}

/** "Dados" and "Marca" of the catalog. Demo state only; no data. */
@Component({
  selector: 'app-design-system-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DesignSystemSpecimenComponent,
    OrgAvatarComponent,
    OrgBadgeComponent,
    OrgDataTableComponent,
    OrgDateBadgeComponent,
    OrgIconButtonComponent,
    OrgLogoComponent,
    OrgMetricCardComponent,
    OrgPartyDriftComponent,
    OrgProgressComponent,
    OrgSectionComponent,
    OrgSplitProgressComponent,
  ],
  templateUrl: './design-system-display.component.html',
  styleUrl: './design-system-display.component.scss',
})
export class DesignSystemDisplayComponent {
  protected readonly snippets = DS_SNIPPETS;

  protected readonly splitSegments: readonly OrgSplitSegment[] = [
    { label: 'Ana', value: 4 },
    { label: 'Marta', value: 2 },
    { label: 'Luiz', value: 1 },
  ];

  protected readonly itemRows: readonly DemoItemRow[] = [
    { name: 'Bolo de milho', who: 'Ana', status: '1 de 1' },
    { name: 'Refrigerante 2L', who: 'Marta, Luiz', status: '3 de 6' },
    { name: 'Pé de moleque', who: '—', status: '0 de 2' },
  ];
  protected readonly itemColumns: readonly OrgDataColumn<DemoItemRow>[] = [
    { id: 'name', label: 'Item', value: (row) => row.name },
    { id: 'who', label: 'Quem leva', value: (row) => row.who },
    { id: 'status', label: 'Garantido', value: (row) => row.status },
  ];
  protected readonly activatedRow = signal<string | null>(null);
}
