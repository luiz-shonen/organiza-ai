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

  const typeInto = (selector: string, value: string): HTMLInputElement => {
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      selector,
    ) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    return input;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyRosterManagerComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyRosterManagerComponent);
    component = fixture.componentInstance;
  });

  it('should render empty state when no family members are present', () => {
    fixture.componentRef.setInput('members', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.family-roster__empty')?.textContent).toContain(
      'Nenhum familiar cadastrado ainda',
    );
    // The add form is always open, with no toggle in the header.
    expect(compiled.querySelector('[data-testid="family-member-form"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="toggle-family-form-btn"]')).toBeNull();
  });

  it('should render the list of family members with relationship and formatted phone', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.family-roster__item');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('Lucas Silva');
    expect(items[0].textContent).toContain('Filho(a)');
    expect(items[1].textContent).toContain('Cônjuge');
    expect(items[1].textContent).toContain('(11) 98888-7777');
  });

  it('should emit addMember from the add form', () => {
    fixture.componentRef.setInput('members', []);
    fixture.detectChanges();
    const addSpy = vi.fn();
    component.addMember.subscribe(addSpy);

    typeInto('[data-testid="family-member-name-input"]', 'Carlos Silva');
    (
      fixture.nativeElement.querySelector('[data-testid="add-family-member-btn"]') as HTMLElement
    ).click();

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Carlos Silva', relationship: 'child' }),
    );
  });

  it('should emit removeMember when the bin is clicked', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();
    const removeSpy = vi.fn();
    component.removeMember.subscribe(removeSpy);

    const removeButtons = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll<HTMLButtonElement>('.family-roster__remove-btn button');
    expect(removeButtons).toHaveLength(2);
    removeButtons[0].click();

    expect(removeSpy).toHaveBeenCalledWith('fam-1');
  });

  it('should edit a member in a sheet and keep the half-typed new member', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();
    const updateSpy = vi.fn();
    const addSpy = vi.fn();
    component.updateMember.subscribe(updateSpy);
    component.addMember.subscribe(addSpy);
    const compiled = fixture.nativeElement as HTMLElement;

    const addName = typeInto('[data-testid="family-member-name-input"]', 'Pedro');
    compiled.querySelectorAll<HTMLButtonElement>('.family-roster__edit-btn button')[1].click();
    fixture.detectChanges();

    expect(compiled.querySelector('[data-testid="edit-family-member-sheet"]')).toBeTruthy();
    const editName = compiled.querySelector(
      '[data-testid="edit-family-member-name-input"]',
    ) as HTMLInputElement;
    expect(editName.value).toBe('Mariana Silva');
    expect(
      (compiled.querySelector('[data-testid="edit-family-member-phone-input"]') as HTMLInputElement)
        .value,
    ).toBe('(11) 98888-7777');

    typeInto('[data-testid="edit-family-member-name-input"]', 'Mariana Souza');
    (compiled.querySelector('[data-testid="edit-family-member-save-btn"]') as HTMLElement).click();
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith({
      id: 'fam-2',
      name: 'Mariana Souza',
      relationship: 'spouse',
      phone: '(11) 98888-7777',
    });
    expect(addSpy).not.toHaveBeenCalled();
    expect(compiled.querySelector('[data-testid="edit-family-member-sheet"]')).toBeNull();
    expect(addName.value).toBe('Pedro');
  });

  it('should close the edit sheet on cancel without emitting', () => {
    fixture.componentRef.setInput('members', mockMembers);
    fixture.detectChanges();
    const updateSpy = vi.fn();
    component.updateMember.subscribe(updateSpy);
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.family-roster__edit-btn button')!.click();
    fixture.detectChanges();
    (
      compiled.querySelector('[data-testid="edit-family-member-cancel-btn"]') as HTMLElement
    ).click();
    fixture.detectChanges();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(compiled.querySelector('[data-testid="edit-family-member-sheet"]')).toBeNull();
  });
});
