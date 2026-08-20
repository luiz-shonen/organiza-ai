import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEditorContainer } from './event-editor.container';
import {
  EventService,
  ItemService,
  GuestService,
  ConfettiService,
  HeaderService,
  AuthService,
} from '../../../core/services';
import { LocationService } from '../../../core/services/location.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PartyEvent } from '../../../core/models';

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('EventEditorContainer', () => {
  let component: EventEditorContainer;
  let fixture: ComponentFixture<EventEditorContainer>;

  let mockCurrentUserSignal = signal<{ uid: string; email: string } | null>({
    uid: 'owner-uid',
    email: 'owner@test.com',
  });

  const mockOwnerEvent: PartyEvent = {
    id: 'evt-123',
    title: 'Festa Junina',
    category: 'Festa Junina',
    description: 'Arraiá com quentão',
    date: '2026-12-20T19:00:00.000Z',
    location: 'Rua das Flores, 100 - Centro - São Paulo/SP - CEP: 01001-000',
    addressDetails: {
      cep: '01001-000',
      address: 'Rua das Flores',
      number: '100',
      neighborhood: 'Centro',
      city: 'São Paulo/SP',
    },
    pixKey: 'pix@test.com',
    status: 'active',
    createdBy: 'owner-uid',
    creatorEmail: 'owner@test.com',
    collaborators: ['collab-uid'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  let mockEventService: {
    getEvent: ReturnType<typeof vi.fn>;
    createEvent: ReturnType<typeof vi.fn>;
    updateEvent: ReturnType<typeof vi.fn>;
    inviteCollaborator: ReturnType<typeof vi.fn>;
    removeCollaborator: ReturnType<typeof vi.fn>;
  };

  let mockItemService: {
    listItems: ReturnType<typeof vi.fn>;
    addItem: ReturnType<typeof vi.fn>;
    deleteItem: ReturnType<typeof vi.fn>;
  };

  let mockGuestService: {
    listGuests: ReturnType<typeof vi.fn>;
  };

  let mockSnackBar: {
    open: ReturnType<typeof vi.fn>;
  };

  let mockDialog: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockCurrentUserSignal.set({ uid: 'owner-uid', email: 'owner@test.com' });

    mockEventService = {
      getEvent: vi.fn().mockReturnValue(of(mockOwnerEvent)),
      createEvent: vi.fn().mockResolvedValue('new-id'),
      updateEvent: vi.fn().mockResolvedValue(undefined),
      inviteCollaborator: vi.fn().mockResolvedValue(undefined),
      removeCollaborator: vi.fn().mockResolvedValue(undefined),
    };

    mockItemService = {
      listItems: vi.fn().mockReturnValue(of([])),
      addItem: vi.fn().mockResolvedValue('item-1'),
      deleteItem: vi.fn().mockResolvedValue(undefined),
    };

    mockGuestService = {
      listGuests: vi.fn().mockReturnValue(of([])),
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    mockDialog = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EventEditorContainer, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: mockEventService },
        { provide: ItemService, useValue: mockItemService },
        { provide: GuestService, useValue: mockGuestService },
        {
          provide: AuthService,
          useValue: {
            currentUser: mockCurrentUserSignal,
          },
        },
        {
          provide: ConfettiService,
          useValue: { fireSuccessConfetti: vi.fn() },
        },
        {
          provide: HeaderService,
          useValue: {},
        },
        {
          provide: LocationService,
          useValue: { getViaCep: vi.fn().mockReturnValue(of(null)) },
        },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();
  });

  describe('when user is the event owner', () => {
    beforeEach(() => {
      mockCurrentUserSignal.set({ uid: 'owner-uid', email: 'owner@test.com' });
      fixture = TestBed.createComponent(EventEditorContainer);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('id', 'evt-123');
      fixture.detectChanges();
    });

    it('should compute isOwner as true and keep forms enabled', () => {
      expect(component.isOwner()).toBe(true);
      expect(component['basicInfoForm'].enabled).toBe(true);
      expect(component['addressForm'].enabled).toBe(true);
      expect(component['pixForm'].enabled).toBe(true);
    });

    it('should allow owner to save event updates', async () => {
      await component['saveEvent']();
      expect(mockEventService.updateEvent).toHaveBeenCalledWith(
        'evt-123',
        expect.objectContaining({
          title: 'Festa Junina',
          createdBy: 'owner-uid',
        })
      );
      expect(mockSnackBar.open).toHaveBeenCalledWith('Evento atualizado!', 'OK', {
        duration: 3000,
      });
    });

    it('should open collaborator dialog for owner', () => {
      const dialogSpy = vi.spyOn(component['dialog'], 'open').mockReturnValue({
        componentInstance: {
          invite: of('newcollab@test.com'),
          removeCollaborator: of('collab-uid'),
        },
      } as any);

      component['openCollaboratorsDialog']();
      expect(dialogSpy).toHaveBeenCalled();
    });
  });

  describe('when user is a collaborator (non-owner)', () => {
    beforeEach(() => {
      mockCurrentUserSignal.set({ uid: 'collab-uid', email: 'collab@test.com' });
      fixture = TestBed.createComponent(EventEditorContainer);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('id', 'evt-123');
      fixture.detectChanges();
    });

    it('should compute isOwner as false and disable core form controls', () => {
      expect(component.isOwner()).toBe(false);
      expect(component['basicInfoForm'].disabled).toBe(true);
      expect(component['addressForm'].disabled).toBe(true);
      expect(component['pixForm'].disabled).toBe(true);
    });

    it('should prevent collaborator from saving main event details and display warning', async () => {
      await component['saveEvent']();
      expect(mockEventService.updateEvent).not.toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Apenas o organizador principal pode salvar alterações'),
        'OK',
        expect.anything()
      );
    });

    it('should allow collaborator to add and delete items', async () => {
      component['newItemName'].set('Refrigerante');
      component['newItemQuantity'].set(3);

      await component['addItem']();

      expect(mockItemService.addItem).toHaveBeenCalledWith('evt-123', {
        name: 'Refrigerante',
        quantity: 3,
      });

      await component['removeItem']({
        id: 'item-99',
        name: 'Pastel',
        quantity: 2,
        claimedBy: null,
      });

      expect(mockItemService.deleteItem).toHaveBeenCalledWith('evt-123', 'item-99');
    });
  });

  describe('when creating a new event', () => {
    beforeEach(() => {
      mockCurrentUserSignal.set({ uid: 'new-creator-uid', email: 'creator@test.com' });
      fixture = TestBed.createComponent(EventEditorContainer);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('id', 'novo');
      fixture.detectChanges();
    });

    it('should compute isOwner as true for new event creation', () => {
      expect(component.isOwner()).toBe(true);
      expect(component['basicInfoForm'].enabled).toBe(true);
    });
  });
});
