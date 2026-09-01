import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminDashboardContainer } from './admin-dashboard.container';
import { AuthService } from '../../core/services/auth.service';
import { EventService } from '../../core/services/event.service';
import { FeedbackService, OrgDialogService } from '../../shared/ui';
import { PartyEvent } from '../../core/models/event.model';

describe('AdminDashboardContainer', () => {
  let fixture: ComponentFixture<AdminDashboardContainer>;
  let component: AdminDashboardContainer;

  let mockAuthService: {
    isSuperAdmin: ReturnType<typeof signal>;
    currentUser: ReturnType<typeof signal>;
    isSuperAdminEmail: ReturnType<typeof vi.fn>;
    listAdmins: ReturnType<typeof vi.fn>;
    registerAdmin: ReturnType<typeof vi.fn>;
    removeAdmin: ReturnType<typeof vi.fn>;
  };
  let mockEventService: {
    listEvents: ReturnType<typeof vi.fn>;
  };
  let mockFeedback: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };
  let mockDialogs: {
    confirm: ReturnType<typeof vi.fn>;
  };

  const sampleEvents: PartyEvent[] = [
    {
      id: 'evt-1',
      title: 'Evento Ativo 1',
      description: 'Desc',
      date: new Date(Date.now() + 86400000).toISOString(),
      location: 'Local 1',
      pixKey: null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-2',
      title: 'Evento Cancelado',
      description: 'Desc',
      date: new Date(Date.now() + 172800000).toISOString(),
      location: 'Local 2',
      pixKey: null,
      status: 'cancelled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const adminList = ['luiz.gmr.dev@gmail.com', 'admin.aux@example.com'];

  beforeEach(async () => {
    mockAuthService = {
      isSuperAdmin: signal(true),
      currentUser: signal({ uid: 'super-1', email: 'luiz.gmr.dev@gmail.com' } as any),
      isSuperAdminEmail: vi.fn((email: string | null) => email === 'luiz.gmr.dev@gmail.com' || email === 'jessica.calm.dev@gmail.com'),
      listAdmins: vi.fn().mockResolvedValue(adminList),
      registerAdmin: vi.fn().mockResolvedValue(undefined),
      removeAdmin: vi.fn().mockResolvedValue(undefined),
    };

    mockEventService = {
      listEvents: vi.fn().mockReturnValue(of(sampleEvents)),
    };

    mockFeedback = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    mockDialogs = {
      confirm: vi.fn().mockReturnValue(of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardContainer],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: EventService, useValue: mockEventService },
        { provide: FeedbackService, useValue: mockFeedback },
        { provide: OrgDialogService, useValue: mockDialogs },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the admin dashboard container', () => {
    expect(component).toBeTruthy();
  });

  it('should load admins on init and compute metrics', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockAuthService.listAdmins).toHaveBeenCalled();
    expect(component.admins()).toEqual(adminList);
    expect(component.loadingAdmins()).toBe(false);

    const metrics = component.metrics();
    expect(metrics.totalEvents).toBe(2);
    expect(metrics.activeEvents).toBe(1);
    expect(metrics.totalAdmins).toBe(2);
    expect(metrics.superAdmins).toBe(2);
  });

  it('should open and close the admin form drawer', () => {
    expect(component.isDrawerOpen()).toBe(false);
    component.openDrawer();
    expect(component.isDrawerOpen()).toBe(true);
    component.closeDrawer();
    expect(component.isDrawerOpen()).toBe(false);
  });

  it('should add admin successfully via handleAddAdmin', async () => {
    component.openDrawer();
    await component.handleAddAdmin('newadmin@example.com');

    expect(mockAuthService.registerAdmin).toHaveBeenCalledWith('newadmin@example.com');
    expect(mockFeedback.success).toHaveBeenCalledWith('Administrador cadastrado com sucesso!');
    expect(component.isDrawerOpen()).toBe(false);
    expect(mockAuthService.listAdmins).toHaveBeenCalledTimes(2);
  });

  it('should handle errors when adding admin fails', async () => {
    mockAuthService.registerAdmin.mockRejectedValueOnce(new Error('Permissão negada'));
    await component.handleAddAdmin('failadmin@example.com');

    expect(mockFeedback.error).toHaveBeenCalledWith('Permissão negada');
    expect(component.savingAdmin()).toBe(false);
  });

  it('should remove admin after confirmation via handleRemoveAdmin', async () => {
    await component.handleRemoveAdmin('admin.aux@example.com');

    expect(mockDialogs.confirm).toHaveBeenCalled();
    expect(mockAuthService.removeAdmin).toHaveBeenCalledWith('admin.aux@example.com');
    expect(mockFeedback.success).toHaveBeenCalledWith('Administrador removido com sucesso!');
  });

  it('should not allow removing super admins', async () => {
    await component.handleRemoveAdmin('luiz.gmr.dev@gmail.com');

    expect(mockFeedback.info).toHaveBeenCalledWith('Super administradores não podem ser removidos.');
    expect(mockAuthService.removeAdmin).not.toHaveBeenCalled();
  });

  it('should render page layout and testids correctly', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const addBtn = fixture.nativeElement.querySelector('[data-testid="add-admin-btn"]');
    const adminItems = fixture.nativeElement.querySelectorAll('[data-testid="admin-user-item"]');

    expect(addBtn).toBeTruthy();
    expect(adminItems.length).toBe(2);
  });
});
