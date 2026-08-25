import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  output,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';

export interface OrgDataColumn<Row> {
  readonly id: string;
  readonly label: string;
  readonly value: (row: Row) => string;
  readonly ariaLabel?: string;
}

@Component({
  selector: 'org-data-table',
  standalone: true,
  imports: [MatTableModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-data-table.component.html',
  styleUrl: './org-data-table.component.scss',
})
export class OrgDataTableComponent<Row> {
  public readonly rows = input<readonly Row[]>([]);
  public readonly columns = input.required<readonly OrgDataColumn<Row>[]>();
  public readonly actionTemplate = input<TemplateRef<{ $implicit: Row }> | null>(null);
  public readonly actionLabel = input('Ações');
  public readonly ariaLabel = input('Tabela de dados');
  public readonly rowActivated = output<Row>();

  protected readonly displayedColumns = computed(() => [
    ...this.columns().map((column) => column.id),
    ...(this.actionTemplate() ? ['actions'] : []),
  ]);

  protected activate(row: Row): void {
    this.rowActivated.emit(row);
  }
}
