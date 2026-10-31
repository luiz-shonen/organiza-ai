import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FamilySelectorComponent } from './family-selector.component';
import { FamilyMember } from '../../../../core/models';

describe('FamilySelectorComponent', () => {
  let component: FamilySelectorComponent;
  let fixture: ComponentFixture<FamilySelectorComponent>;

  const mockMembers: FamilyMember[] = [
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilySelectorComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilySelectorComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('members', []);
    fixture.componentRef.setInput('selectedIds', []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should compute selectedCount and display selection badge', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.componentRef.setInput('selectedIds', ['fam-1']);
    fixture.detectChanges();

    expect(component['selectedCount']()).toBe(1);
    expect(component['allSelected']()).toBe(false);
    expect(component['indeterminate']()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('1 selecionado(s)');
  });

  it('should compute allSelected as true when all members are in selectedIds', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.componentRef.setInput('selectedIds', ['fam-1', 'fam-2']);
    fixture.detectChanges();

    expect(component['allSelected']()).toBe(true);
    expect(component['indeterminate']()).toBe(false);
    expect(component['selectedCount']()).toBe(2);
  });

  it('should emit toggleMember when a member checkbox is changed', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.componentRef.setInput('selectedIds', []);
    fixture.detectChanges();

    const toggleSpy = vi.fn();
    component.toggleMember.subscribe(toggleSpy);

    component['onToggleMember']('fam-1');

    expect(toggleSpy).toHaveBeenCalledWith('fam-1');
  });

  it('should emit selectAll when select all checkbox changes', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.componentRef.setInput('selectedIds', []);
    fixture.detectChanges();

    const selectAllSpy = vi.fn();
    component.selectAll.subscribe(selectAllSpy);

    component['onSelectAllChange'](true);

    expect(selectAllSpy).toHaveBeenCalledWith(true);
  });

  it('should show inline form and emit addInlineMember upon submission', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.componentRef.setInput('selectedIds', []);
    fixture.detectChanges();

    const addInlineSpy = vi.fn();
    component.addInlineMember.subscribe(addInlineSpy);

    // Open inline form
    component['onToggleInlineForm']();
    expect(component['showInlineForm']()).toBe(true);

    // Set values
    component['inlineName'].set('Pedro Silva');
    component['setInlineRelationship']('sibling');
    component['inlinePhone'].set('11966665555');

    component['onSubmitInline']();

    expect(addInlineSpy).toHaveBeenCalledWith({
      name: 'Pedro Silva',
      relationship: 'sibling',
      phone: '11966665555',
    });
    expect(component['showInlineForm']()).toBe(false);
    expect(component['inlineName']()).toBe('');
  });

  it('should compose the six relationship choices with the shared autocomplete field', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.componentRef.setInput('selectedIds', []);
    fixture.detectChanges();

    (component as unknown as { onToggleInlineForm: () => void }).onToggleInlineForm();
    fixture.detectChanges();

    expect(component['relationshipOptions']).toHaveLength(6);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('org-autocomplete-field'),
    ).toBeTruthy();
  });

  it('should cancel inline form without emitting addInlineMember', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();

    const addInlineSpy = vi.fn();
    component.addInlineMember.subscribe(addInlineSpy);

    component['onToggleInlineForm']();
    component['inlineName'].set('Draft Name');
    component['onCancelInlineForm']();

    expect(addInlineSpy).not.toHaveBeenCalled();
    expect(component['showInlineForm']()).toBe(false);
    expect(component['inlineName']()).toBe('');
  });

  it('should not emit addInlineMember if name is empty', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();

    const addInlineSpy = vi.fn();
    component.addInlineMember.subscribe(addInlineSpy);

    component['inlineName'].set('   ');
    component['onSubmitInline']();

    expect(addInlineSpy).not.toHaveBeenCalled();
  });
});
