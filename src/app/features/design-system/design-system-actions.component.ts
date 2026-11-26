import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgChipComponent,
  OrgCopyButtonComponent,
  OrgEditableChipComponent,
  OrgExpansionPanelComponent,
  OrgIconButtonComponent,
  OrgPageHeaderComponent,
  OrgSectionComponent,
  OrgSplitProgressComponent,
  OrgSurfaceComponent,
} from '../../shared/ui';
import { DS_SNIPPETS } from './design-system-snippets';
import { DesignSystemSpecimenComponent } from './design-system-specimen.component';

/** "Página e cards" and "Ações" of the catalog. Demo state only; no data. */
@Component({
  selector: 'app-design-system-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DesignSystemSpecimenComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgChipComponent,
    OrgCopyButtonComponent,
    OrgEditableChipComponent,
    OrgExpansionPanelComponent,
    OrgIconButtonComponent,
    OrgPageHeaderComponent,
    OrgSectionComponent,
    OrgSplitProgressComponent,
    OrgSurfaceComponent,
  ],
  templateUrl: './design-system-actions.component.html',
  styleUrl: './design-system-actions.component.scss',
})
export class DesignSystemActionsComponent {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly snippets = DS_SNIPPETS;
  protected readonly categories = ['Aniversário', 'Churrasco', 'Casamento'] as const;
  protected readonly category = signal<string | null>('Aniversário');
  protected readonly customCategory = signal<string | null>(null);
  protected readonly familyOpen = signal(true);
  protected readonly saving = signal(false);
  protected readonly locked = signal(true);
  protected readonly demoUrl = 'https://organiza-ai.web.app/convite/arraia-no-jardim';
  /** The demo save's timer: one at a time, cleared when the page closes. */
  private saveTimer?: ReturnType<typeof setTimeout>;

  public constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.saveTimer));
  }

  protected pickCategory(name: string): void {
    this.customCategory.set(null);
    this.category.set(name);
  }

  protected setCustomCategory(value: string): void {
    this.category.set(null);
    this.customCategory.set(value);
  }

  /** Shows the loading state for a moment, as a real save would. */
  protected save(): void {
    clearTimeout(this.saveTimer);
    this.saving.set(true);
    this.saveTimer = setTimeout(() => this.saving.set(false), 1600);
  }
}
