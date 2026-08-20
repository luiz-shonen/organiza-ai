import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminFormDrawerComponent } from './admin-form-drawer.component';
import { AuthService, DrawerService } from '../../../../../core/services';

describe('AdminFormDrawerComponent', () => {
  let fixture: ComponentFixture<AdminFormDrawerComponent>;
  let component: AdminFormDrawerComponent;

  let mockAuthService: {
    listAdmins: ReturnType<typeof vi.fn>;
    registerAdmin: ReturnType<typeof vi.fn>;
    removeAdmin: ReturnType<typeof vi.fn>;
    isSuperAdminEmail: ReturnType<typeof vi.fn>;
  };
  let mockDrawerService: {
    close: ReturnType<typeof vi.fn>;
  };
  let mockSnackBar: {
    open: ReturnType<typeof vi.fn>;
  };
  let mockDialog: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAuthService = {
      listAdmins: vi
        .fn()
        .mockResolvedValue(['admin2@test.com', 'luiz.gmr.dev@gmail.com', 'admin1@test.com']),
      registerAdmin: vi.fn().mockResolvedValue(undefined),
      removeAdmin: vi.fn().mockResolvedValue(undefined),
      isSuperAdminEmail: vi.fn((email: string) => email === 'luiz.gmr.dev@gmail.com'),
    };

    mockDrawerService = {
      close: vi.fn(),
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    mockDialog = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminFormDrawerComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: DrawerService, useValue: mockDrawerService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminFormDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create and load admins with superadmin sorted first', async () => {
    expect(component).toBeTruthy();
    expect(mockAuthService.listAdmins).toHaveBeenCalled();
    const admins = (component as any).admins();
    expect(admins).toEqual(['luiz.gmr.dev@gmail.com', 'admin1@test.com', 'admin2@test.com']);
  });

  it('should handle error when loading admins fails', async () => {
    mockAuthService.listAdmins.mockRejectedValueOnce(new Error('Permission denied'));
    (component as any).loadAdmins();
    await fixture.whenStable();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Erro ao carregar administradores.', 'OK', {
      duration: 3000,
    });
  });

  it('should add a new admin on valid form submit', async () => {
    (component as any).form.controls.email.setValue('newadmin@test.com');
    await (component as any).submit();

    expect(mockAuthService.registerAdmin).toHaveBeenCalledWith('newadmin@test.com');
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Administrador adicionado à whitelist com sucesso!',
      'OK',
      { duration: 3000 },
    );
    expect((component as any).form.controls.email.value).toBe('');
  });

  it('should handle error when adding admin fails', async () => {
    mockAuthService.registerAdmin.mockRejectedValueOnce(
      new Error('Apenas super administradores podem cadastrar novos admins.'),
    );
    (component as any).form.controls.email.setValue('invalid@test.com');
    await (component as any).submit();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Apenas super administradores podem cadastrar novos admins.',
      'OK',
      { duration: 4000 },
    );
    expect((component as any).loading()).toBe(false);
  });

  it('should not submit if form is invalid', async () => {
    (component as any).form.controls.email.setValue('invalid-email');
    await (component as any).submit();
    expect(mockAuthService.registerAdmin).not.toHaveBeenCalled();
  });

  it('should remove admin when confirmed in dialog', async () => {
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(true),
    });

    await (component as any).removeAdmin('admin1@test.com');
    await fixture.whenStable();

    expect(mockAuthService.removeAdmin).toHaveBeenCalledWith('admin1@test.com');
    expect(mockSnackBar.open).toHaveBeenCalledWith('Administrador removido com sucesso!', 'OK', {
      duration: 3000,
    });
  });

  it('should not remove admin when dialog is dismissed', async () => {
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(false),
    });

    await (component as any).removeAdmin('admin1@test.com');
    await fixture.whenStable();

    expect(mockAuthService.removeAdmin).not.toHaveBeenCalled();
  });

  it('should handle error during admin removal', async () => {
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(true),
    });
    mockAuthService.removeAdmin.mockRejectedValueOnce(
      new Error('Super administradores não podem ser removidos.'),
    );

    await (component as any).removeAdmin('admin1@test.com');
    await fixture.whenStable();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Super administradores não podem ser removidos.',
      'OK',
      { duration: 3000 },
    );
  });

  it('should emit close output and trigger drawerService.close on onClose', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    (component as any).onClose();

    expect(closeSpy).toHaveBeenCalled();
    expect(mockDrawerService.close).toHaveBeenCalled();
  });
});
