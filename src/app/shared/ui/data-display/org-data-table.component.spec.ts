import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { OrgDataColumn, OrgDataTableComponent } from './org-data-table.component';

interface Row {
  readonly name: string;
}

describe('OrgDataTableComponent', () => {
  it('renders typed columns and emits the activated row', async () => {
    await TestBed.configureTestingModule({ imports: [OrgDataTableComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgDataTableComponent<Row>> = TestBed.createComponent(
      OrgDataTableComponent<Row>,
    );
    const rows: readonly Row[] = [{ name: 'Arraiá no jardim' }];
    const columns: readonly OrgDataColumn<Row>[] = [
      { id: 'name', label: 'Evento', value: (row) => row.name },
    ];
    const activated = vi.fn();
    fixture.componentInstance.rowActivated.subscribe(activated);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('tr[mat-row]') as HTMLElement;
    expect(fixture.nativeElement.textContent).toContain('Arraiá no jardim');
    row.click();
    expect(activated).toHaveBeenCalledWith(rows[0]);
  });
});
