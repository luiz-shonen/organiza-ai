import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FamilyRosterManagerComponent } from './family-roster-manager.component';
import { FamilyMember } from '../../../../core/models';

describe('FamilyRosterManagerComponent', () => {
  let component: FamilyRosterManagerComponent;
  let fixture: ComponentFixture<FamilyRosterManagerComponent>;

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
      imports: [FamilyRosterManagerComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyRosterManagerComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('members', []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render empty state when no family members are present', () => {
    fixture.componentRef.setInput('members', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.family-roster__empty')).toBeTruthy();
    expect(compiled.textContent).toContain('Nenhum familiar cadastrado ainda');
  });

  it('should compose the roster in one shared surface with governed fields and actions', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('org-surface')).toHaveLength(1);
    expect(compiled.querySelectorAll('mat-card')).toHaveLength(0);
    expect(component['relationshipOptions']).toHaveLength(6);
    // The form is always open, with no toggle in the header.
    expect(compiled.querySelector('[data-testid="toggle-family-form-btn"]')).toBeNull();
    expect(compiled.querySelectorAll('org-text-field, org-autocomplete-field')).toHaveLength(3);
    expect(compiled.querySelector('.family-roster__add-btn')).toBeInstanceOf(HTMLElement);
    expect(compiled.querySelector('.family-roster__remove-btn')).toBeInstanceOf(HTMLElement);
    expect(compiled.querySelectorAll('org-icon')).not.toHaveLength(0);
  });

  it('should render the list of family members with badges and phone', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.family-roster__item');
    expect(items.length).toBe(2);

    expect(items[0].textContent).toContain('Lucas Silva');
    expect(items[0].textContent).toContain('Filho(a)');

    expect(items[1].textContent).toContain('Mariana Silva');
    expect(items[1].textContent).toContain('Cônjuge');
    expect(items[1].textContent).toContain('(11) 98888-7777');
  });

  it('should emit addMember output with valid payload and clear form inputs', () => {
    fixture.componentRef.setInput('members', []);
    fixture.detectChanges();

    const addSpy = vi.fn();
    component.addMember.subscribe(addSpy);

    // Simulate entering form values
    component['newName'].set('Carlos Silva');
    component['newRelationship'].set('parent');
    component['newPhone'].set('11977775555');

    component['onSubmit']();

    expect(addSpy).toHaveBeenCalledWith({
      name: 'Carlos Silva',
      relationship: 'parent',
      phone: '(11) 97777-5555',
    });

    expect(component['newName']()).toBe('');
    expect(component['newRelationship']()).toBe('child');
    expect(component['newPhone']()).toBe('');
  });

  it('should not emit addMember with an invalid phone and should show the error', () => {
    fixture.componentRef.setInput('members', []);
    fixture.detectChanges();
    const addSpy = vi.fn();
    component.addMember.subscribe(addSpy);

    component['newName'].set('Carlos Silva');
    component['newPhone'].set('(11) 9777');
    component['onSubmit']();
    fixture.detectChanges();

    expect(addSpy).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Telefone inválido');
    expect(component['newName']()).toBe('Carlos Silva');
  });

  it('should preserve the selected relationship value from the autocomplete field', () => {
    fixture.componentRef.setInput('members', []);
    fixture.detectChanges();

    component['newName'].set('Carlos Silva');
    component['setRelationship']('parent');
    const addSpy = vi.fn();
    component.addMember.subscribe(addSpy);

    component['onSubmit']();

    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ relationship: 'parent' }));
  });

  it('should not emit addMember when name is empty or only whitespace', () => {
    fixture.componentRef.setInput('members', []);
    fixture.detectChanges();

    const addSpy = vi.fn();
    component.addMember.subscribe(addSpy);

    component['newName'].set('   ');
    component['onSubmit']();

    expect(addSpy).not.toHaveBeenCalled();
  });

  it('should emit removeMember output when delete button is clicked', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();

    const removeSpy = vi.fn();
    component.removeMember.subscribe(removeSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    const removeButtons = compiled.querySelectorAll<HTMLButtonElement>(
      '.family-roster__remove-btn button',
    );
    expect(removeButtons.length).toBe(2);

    removeButtons[0].click();

    expect(removeSpy).toHaveBeenCalledWith('fam-1');
  });

  it('should load a member into the form and emit updateMember on save', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();

    const updateSpy = vi.fn();
    const addSpy = vi.fn();
    component.updateMember.subscribe(updateSpy);
    component.addMember.subscribe(addSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelectorAll<HTMLButtonElement>('.family-roster__edit-btn button')[1].click();
    fixture.detectChanges();

    expect(component['newName']()).toBe('Mariana Silva');
    expect(component['newRelationship']()).toBe('spouse');
    expect(component['newPhone']()).toBe('(11) 98888-7777');
    expect(compiled.querySelector('.family-roster__form-title')?.textContent).toContain(
      'Editando Mariana Silva',
    );
    expect(compiled.querySelectorAll('.family-roster__item--editing')).toHaveLength(1);
    expect(compiled.querySelector('[data-testid="add-family-member-btn"]')?.textContent).toContain(
      'Salvar alterações',
    );

    component['newName'].set('Mariana Souza');
    component['onSubmit']();

    expect(updateSpy).toHaveBeenCalledWith({
      id: 'fam-2',
      name: 'Mariana Souza',
      relationship: 'spouse',
      phone: '(11) 98888-7777',
    });
    expect(addSpy).not.toHaveBeenCalled();
    expect(component['editingId']()).toBeNull();
    expect(component['newName']()).toBe('');
  });

  it('should leave edit mode on cancel without emitting', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();

    const updateSpy = vi.fn();
    component.updateMember.subscribe(updateSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.family-roster__edit-btn button')!.click();
    fixture.detectChanges();
    compiled
      .querySelector<HTMLButtonElement>('[data-testid="cancel-edit-family-member-btn"] button')!
      .click();
    fixture.detectChanges();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(component['editingId']()).toBeNull();
    expect(compiled.querySelector('[data-testid="add-family-member-btn"]')?.textContent).toContain(
      'Adicionar familiar',
    );
  });
});
