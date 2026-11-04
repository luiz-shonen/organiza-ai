import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FamilyMemberFormComponent,
  type AddFamilyMemberPayload,
} from './family-member-form.component';

describe('FamilyMemberFormComponent', () => {
  let fixture: ComponentFixture<FamilyMemberFormComponent>;
  let component: FamilyMemberFormComponent;
  let submitted: ReturnType<typeof vi.fn<(payload: AddFamilyMemberPayload) => void>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyMemberFormComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    fixture = TestBed.createComponent(FamilyMemberFormComponent);
    component = fixture.componentInstance;
    submitted = vi.fn<(payload: AddFamilyMemberPayload) => void>();
    component.submitted.subscribe(submitted);
    fixture.detectChanges();
  });

  it('emits a tidied name, the relationship and a formatted phone, then clears', () => {
    component['name'].set('  Carlos   Silva ');
    component['setRelationship']('parent');
    component['phone'].set('11977775555');
    component['submit']();

    expect(submitted).toHaveBeenCalledWith({
      name: 'Carlos Silva',
      relationship: 'parent',
      phone: '(11) 97777-5555',
    });
    expect(component['name']()).toBe('');
    expect(component['relationship']()).toBe('child');
    expect(component['phone']()).toBe('');
  });

  it('says the name is required instead of silently doing nothing', () => {
    component['submit']();
    fixture.detectChanges();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Informe o nome do familiar');
  });

  it('refuses an invalid name, an unknown relationship and an incomplete phone', () => {
    component['name'].set('Lucas <b>');
    component['setRelationship'](null);
    component['phone'].set('(11) 9777');
    component['submit']();
    fixture.detectChanges();

    expect(submitted).not.toHaveBeenCalled();
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Use só letras, espaços, hífen ou apóstrofo');
    expect(text).toContain('Escolha um parentesco da lista');
    expect(text).toContain('Telefone inválido');
    expect(component['name']()).toBe('Lucas <b>');
  });

  it('loads a member to edit and keeps it after saving', () => {
    fixture.componentRef.setInput('member', {
      id: 'fam-2',
      name: 'Mariana Silva',
      relationship: 'spouse',
      phone: '11988887777',
      createdAt: '',
    });
    fixture.componentRef.setInput('cancelLabel', 'Cancelar');
    fixture.componentRef.setInput('testIdPrefix', 'edit-family-member');
    fixture.detectChanges();

    expect(component['phone']()).toBe('(11) 98888-7777');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="edit-family-member-save-btn"]')).toBeTruthy();

    component['submit']();
    expect(submitted).toHaveBeenCalledWith({
      name: 'Mariana Silva',
      relationship: 'spouse',
      phone: '(11) 98888-7777',
    });
    expect(component['name']()).toBe('Mariana Silva');
  });
});
