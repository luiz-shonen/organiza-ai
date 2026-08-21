import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  CollaboratorInviteDialogComponent,
  CollaboratorInviteDialogData,
} from './collaborator-invite-dialog.component';

describe('CollaboratorInviteDialogComponent', () => {
  let component: CollaboratorInviteDialogComponent;
  let fixture: ComponentFixture<CollaboratorInviteDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const defaultData: CollaboratorInviteDialogData = {
    collaborators: ['ana@exemplo.com', 'carlos@exemplo.com'],
    pendingInvites: ['pedro@exemplo.com'],
  };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CollaboratorInviteDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: defaultData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CollaboratorInviteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate email format properly', () => {
    expect(component.isEmailValid()).toBe(false);

    component.email.set('not-an-email');
    expect(component.isEmailValid()).toBe(false);

    component.email.set('valid.email@test.com');
    expect(component.isEmailValid()).toBe(true);
  });

  it('should emit invite output and reset control on valid submission', () => {
    const inviteSpy = vi.fn();
    component.invite.subscribe(inviteSpy);

    component.email.set('  New.Collab@Domain.Com ');
    component.onInvite();

    expect(inviteSpy).toHaveBeenCalledWith('new.collab@domain.com');
    expect(component.email()).toBe('');
  });

  it('should not emit invite output when form is invalid', () => {
    const inviteSpy = vi.fn();
    component.invite.subscribe(inviteSpy);

    component.email.set('invalid-email');
    component.onInvite();

    expect(inviteSpy).not.toHaveBeenCalled();
  });

  it('should emit removeCollaborator output when removing a collaborator', () => {
    const removeSpy = vi.fn();
    component.removeCollaborator.subscribe(removeSpy);

    component.onRemoveCollaborator('ana@exemplo.com');

    expect(removeSpy).toHaveBeenCalledWith('ana@exemplo.com');
  });

  it('should render active collaborators and pending invites chips', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('ana@exemplo.com');
    expect(compiled.textContent).toContain('carlos@exemplo.com');
    expect(compiled.textContent).toContain('pedro@exemplo.com');
    expect(compiled.textContent).toContain('Colaboradores Ativos (2)');
    expect(compiled.textContent).toContain('Convites Pendentes (1)');
  });

  it('should close the dialog when closeDialog is invoked', () => {
    component.closeDialog();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
