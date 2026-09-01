import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { OrgDialogService } from './org-dialog.service';

describe('OrgDialogService', () => {
  it('maps dialog closing values to a boolean confirmation result', () => {
    const open = vi.fn().mockReturnValue({ afterClosed: () => of(true) });
    TestBed.configureTestingModule({
      providers: [OrgDialogService, { provide: MatDialog, useValue: { open } }],
    });
    const service = TestBed.inject(OrgDialogService);
    let result: boolean | undefined;
    service.confirm({ title: 'Excluir', message: 'Confirmar exclusão?' }).subscribe((value) => {
      result = value;
    });

    expect(result).toBe(true);
    expect(open).toHaveBeenCalledOnce();
  });
});
