import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { FamilySelectorComponent } from './family-selector.component';
import { FamilyMemberFormComponent } from '../../../../shared/components/family-member-form/family-member-form.component';
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
    expect(compiled.textContent).toContain('1 selecionado');
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

  /** The form shown for a new relative or for one being edited. */
  function memberForm(prefix: string): FamilyMemberFormComponent {
    const found = fixture.debugElement
      .queryAll(By.directive(FamilyMemberFormComponent))
      .map((debug) => debug.componentInstance as FamilyMemberFormComponent)
      .find((form) => form.testIdPrefix() === prefix);
    if (!found) throw new Error(`No form ${prefix}`);
    return found;
  }

  it('adds a relative with the profile form, phone included, and closes it', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();
    const added = vi.fn();
    component.addInlineMember.subscribe(added);

    component['onToggleInlineForm']();
    fixture.detectChanges();
    const form = memberForm('inline-family-member');
    form['name'].set('Pedro Silva');
    form['setRelationship']('sibling');
    form['phone'].set('11977775555');
    form['submit']();
    fixture.detectChanges();

    expect(added).toHaveBeenCalledWith({
      name: 'Pedro Silva',
      relationship: 'sibling',
      phone: '(11) 97777-5555',
    });
    expect(component['showInlineForm']()).toBe(false);
  });

  it('offers Pet among the kinships and asks no phone for one', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();
    component['onToggleInlineForm']();
    fixture.detectChanges();

    const form = memberForm('inline-family-member');
    const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text()).toContain('WhatsApp');
    form['setRelationship']('pet');
    fixture.detectChanges();
    expect(text()).not.toContain('WhatsApp');
  });

  it('edits a relative in its own row and emits the changes', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();
    const updated = vi.fn();
    component.updateMember.subscribe(updated);

    component['onEdit']('fam-2');
    fixture.detectChanges();
    const form = memberForm('edit-family-member');
    expect(form['name']()).toBe('Mariana Silva');
    form['name'].set('Mariana Souza');
    form['submit']();
    fixture.detectChanges();

    expect(updated).toHaveBeenCalledWith({
      id: 'fam-2',
      name: 'Mariana Souza',
      relationship: 'spouse',
      phone: '(11) 98888-7777',
    });
    expect(component['editingId']()).toBeNull();
  });

  it('asks to remove a relative', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();
    const removed = vi.fn();
    component.removeMember.subscribe(removed);

    (
      fixture.nativeElement.querySelectorAll(
        '[data-testid="family-selector-remove-btn"] button, button[data-testid="family-selector-remove-btn"]',
      )[0] as HTMLButtonElement
    ).click();

    expect(removed).toHaveBeenCalledWith('fam-1');
  });

  it('cancels the new relative without emitting', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();
    const added = vi.fn();
    component.addInlineMember.subscribe(added);

    component['onToggleInlineForm']();
    component['onCancelInlineForm']();

    expect(added).not.toHaveBeenCalled();
    expect(component['showInlineForm']()).toBe(false);
  });
});
