import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GuestFormDialogComponent,
  GuestFormDialogData,
} from './guest-form-dialog.component';
import { FamilyService } from '../../../../core/services/family.service';
import { FamilyMember } from '../../../../core/models';

describe('GuestFormDialogComponent', () => {
  let component: GuestFormDialogComponent;
  let fixture: ComponentFixture<GuestFormDialogComponent>;

  let mockDialogRef: {
    close: ReturnType<typeof vi.fn>;
  };
  let mockFamilyService: {
    addFamilyMember: ReturnType<typeof vi.fn>;
  };

  const mockFamilyMembers: FamilyMember[] = [
    {
      id: 'fam-1',
      name: 'Lucas Silva',
      relationship: 'child',
      createdAt: '2026-08-10T10:00:00.000Z',
    },
    {
      id: 'fam-2',
      name: 'Mariana Silva',
      relationship: 'spouse',
      phone: '11988887777',
      createdAt: '2026-08-11T10:00:00.000Z',
    },
  ];

  const defaultData: GuestFormDialogData = {
    session: { name: 'Carlos Silva', phone: '11999998888' },
    familyMembers: mockFamilyMembers,
    userId: 'user-123',
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };
    mockFamilyService = {
      addFamilyMember: vi.fn().mockResolvedValue({
        id: 'fam-new',
        name: 'Pedro',
        relationship: 'sibling',
        createdAt: '2026-08-19T00:00:00.000Z',
      }),
    };

    await TestBed.configureTestingModule({
      imports: [GuestFormDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: defaultData },
        { provide: FamilyService, useValue: mockFamilyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GuestFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the dialog and initialize form with passed data', () => {
    expect(component).toBeTruthy();
    expect(component.familyMembers()).toEqual(mockFamilyMembers);
    expect((component as any).form.getRawValue()).toEqual({
      name: 'Carlos Silva',
      phone: '11999998888',
      companionsCount: 0,
    });
  });

  it('should toggle individual family member selection', () => {
    expect(component.selectedFamilyMemberIds()).toEqual([]);

    (component as any).onToggleFamilyMember('fam-1');
    expect(component.selectedFamilyMemberIds()).toEqual(['fam-1']);

    (component as any).onToggleFamilyMember('fam-2');
    expect(component.selectedFamilyMemberIds()).toEqual(['fam-1', 'fam-2']);

    (component as any).onToggleFamilyMember('fam-1');
    expect(component.selectedFamilyMemberIds()).toEqual(['fam-2']);
  });

  it('should select all and deselect all family members', () => {
    (component as any).onSelectAllFamily(true);
    expect(component.selectedFamilyMemberIds()).toEqual(['fam-1', 'fam-2']);

    (component as any).onSelectAllFamily(false);
    expect(component.selectedFamilyMemberIds()).toEqual([]);
  });

  it('should add inline family member via FamilyService and auto-select them', async () => {
    await (component as any).onAddInlineFamilyMember({
      name: 'Pedro',
      relationship: 'sibling',
      phone: '11955554444',
    });

    expect(mockFamilyService.addFamilyMember).toHaveBeenCalledWith('user-123', {
      name: 'Pedro',
      relationship: 'sibling',
      phone: '11955554444',
    });

    expect(component.familyMembers().length).toBe(3);
    expect(component.selectedFamilyMemberIds()).toContain('fam-new');
  });

  it('should close dialog with form payload and selected family members on submit', () => {
    (component as any).onToggleFamilyMember('fam-1');

    (component as any).submit();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      name: 'Carlos Silva',
      phone: '11999998888',
      companionsCount: 0,
      selectedFamilyMembers: [mockFamilyMembers[0]],
    });
  });

  it('should not close dialog if form is invalid', () => {
    (component as any).form.controls.name.setValue('');
    (component as any).submit();

    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
