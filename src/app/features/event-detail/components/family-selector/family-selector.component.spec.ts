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

    expect((component as any).selectedCount()).toBe(1);
    expect((component as any).allSelected()).toBe(false);
    expect((component as any).indeterminate()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('1 selecionado(s)');
  });

  it('should compute allSelected as true when all members are in selectedIds', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.componentRef.setInput('selectedIds', ['fam-1', 'fam-2']);
    fixture.detectChanges();

    expect((component as any).allSelected()).toBe(true);
    expect((component as any).indeterminate()).toBe(false);
    expect((component as any).selectedCount()).toBe(2);
  });

  it('should emit toggleMember when a member checkbox is changed', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.componentRef.setInput('selectedIds', []);
    fixture.detectChanges();

    const toggleSpy = vi.fn();
    component.toggleMember.subscribe(toggleSpy);

    (component as any).onToggleMember('fam-1');

    expect(toggleSpy).toHaveBeenCalledWith('fam-1');
  });

  it('should emit selectAll when select all checkbox changes', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.componentRef.setInput('selectedIds', []);
    fixture.detectChanges();

    const selectAllSpy = vi.fn();
    component.selectAll.subscribe(selectAllSpy);

    (component as any).onSelectAllChange(true);

    expect(selectAllSpy).toHaveBeenCalledWith(true);
  });

  it('should show inline form and emit addInlineMember upon submission', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.componentRef.setInput('selectedIds', []);
    fixture.detectChanges();

    const addInlineSpy = vi.fn();
    component.addInlineMember.subscribe(addInlineSpy);

    // Open inline form
    (component as any).onToggleInlineForm();
    expect((component as any).showInlineForm()).toBe(true);

    // Set values
    (component as any).inlineName.set('Pedro Silva');
    (component as any).inlineRelationship.set('sibling');
    (component as any).inlinePhone.set('11966665555');

    (component as any).onSubmitInline();

    expect(addInlineSpy).toHaveBeenCalledWith({
      name: 'Pedro Silva',
      relationship: 'sibling',
      phone: '11966665555',
    });
    expect((component as any).showInlineForm()).toBe(false);
    expect((component as any).inlineName()).toBe('');
  });

  it('should cancel inline form without emitting addInlineMember', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();

    const addInlineSpy = vi.fn();
    component.addInlineMember.subscribe(addInlineSpy);

    (component as any).onToggleInlineForm();
    (component as any).inlineName.set('Draft Name');
    (component as any).onCancelInlineForm();

    expect(addInlineSpy).not.toHaveBeenCalled();
    expect((component as any).showInlineForm()).toBe(false);
    expect((component as any).inlineName()).toBe('');
  });

  it('should not emit addInlineMember if name is empty', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();

    const addInlineSpy = vi.fn();
    component.addInlineMember.subscribe(addInlineSpy);

    (component as any).inlineName.set('   ');
    (component as any).onSubmitInline();

    expect(addInlineSpy).not.toHaveBeenCalled();
  });
});
