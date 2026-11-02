import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileInfoCardComponent } from './profile-info-card.component';
import type { UserProfile } from '../../../../core/models';

describe('ProfileInfoCardComponent', () => {
  let component: ProfileInfoCardComponent;
  let fixture: ComponentFixture<ProfileInfoCardComponent>;

  const mockUser: UserProfile = {
    uid: 'user-456',
    email: 'maria@example.com',
    displayName: 'Maria Santos',
    photoURL: null,
    phone: '11987654321',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileInfoCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileInfoCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('user', mockUser);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render user display name, email, phone, and avatar initial', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Maria Santos');
    expect(el.textContent).toContain('maria@example.com');
    expect(el.textContent).toContain('11987654321');
    expect(el.textContent).toContain('M');
  });

  it('should compose personal data in one shared surface with governed field and actions', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelectorAll('org-surface')).toHaveLength(1);
    expect(el.querySelectorAll('mat-card')).toHaveLength(0);
    expect(el.querySelector('.profile-info-card')).toBeTruthy();

    component.startEditing();
    fixture.detectChanges();

    expect(el.querySelector('org-text-field')).toBeTruthy();
    expect(el.querySelector('.profile-info-card__save-btn')).toBeInstanceOf(HTMLElement);
    expect(el.querySelector('.profile-info-card__cancel-btn')).toBeInstanceOf(HTMLElement);
  });

  it('should render photoURL image when provided', () => {
    const userWithPhoto: UserProfile = {
      ...mockUser,
      photoURL: 'https://example.com/avatar.jpg',
    };
    fixture.componentRef.setInput('user', userWithPhoto);
    fixture.detectChanges();

    const img: HTMLImageElement | null = fixture.nativeElement.querySelector(
      'img.profile-info-card__avatar',
    );
    expect(img).toBeTruthy();
    expect(img?.src).toContain('https://example.com/avatar.jpg');
  });

  it('should toggle inline editing mode when edit button is clicked', () => {
    expect(component.isEditing()).toBe(false);

    const editBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector(
      '.profile-info-card__edit-btn button',
    );
    editBtn?.click();
    fixture.detectChanges();

    expect(component.isEditing()).toBe(true);
    expect(component.editName()).toBe('Maria Santos');
    expect(component.editPhone()).toBe('11987654321');
    expect(fixture.nativeElement.querySelector('[data-testid="profile-phone-input"]')).toBeTruthy();
  });

  it('should cancel editing mode when cancel button is clicked', () => {
    component.startEditing();
    fixture.detectChanges();
    expect(component.isEditing()).toBe(true);

    component.cancelEditing();
    fixture.detectChanges();

    expect(component.isEditing()).toBe(false);
    expect(component.editName()).toBe('Maria Santos');
  });

  it('should emit updateDetails with trimmed name and phone and close edit mode on save', () => {
    const emitSpy = vi.spyOn(component.updateDetails, 'emit');

    component.startEditing();
    component.editName.set('  Maria Silva  ');
    component.editPhone.set(' 11911112222 ');
    component.saveDetails();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith({ displayName: 'Maria Silva', phone: '11911112222' });
    expect(component.isEditing()).toBe(false);
  });

  it('should emit an empty phone when the phone is cleared', () => {
    const emitSpy = vi.spyOn(component.updateDetails, 'emit');

    component.startEditing();
    component.editPhone.set('');
    component.saveDetails();

    expect(emitSpy).toHaveBeenCalledWith({ displayName: 'Maria Santos', phone: '' });
  });

  it('should restore the phone when editing is cancelled', () => {
    component.startEditing();
    component.editPhone.set('000');
    component.cancelEditing();

    expect(component.editPhone()).toBe('11987654321');
  });

  it('should not emit updateDetails when editName is blank', () => {
    const emitSpy = vi.spyOn(component.updateDetails, 'emit');

    component.startEditing();
    component.editName.set('    ');
    component.saveDetails();
    fixture.detectChanges();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.isEditing()).toBe(true);
  });
});
