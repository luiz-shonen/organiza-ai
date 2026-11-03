import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEditorContainer } from './event-editor.container';
import {
  EventService,
  ItemService,
  ConfettiService,
  HeaderService,
  AuthService,
  DrawerService,
} from '../../../core/services';
import { LocationService } from '../../../core/services/location.service';
import { MatStepper } from '@angular/material/stepper';
import { By } from '@angular/platform-browser';
import { PartyEvent } from '../../../core/models';
import { FeedbackService, OrgDialogService } from '../../../shared/ui';

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('EventEditorContainer', () => {
  const mockDialogs = { confirm: vi.fn(() => of(true)) };
  let component: EventEditorContainer;
  let fixture: ComponentFixture<EventEditorContainer>;

  const mockCurrentUserSignal = signal<{ uid: string; email: string } | null>({
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
    updateItem: ReturnType<typeof vi.fn>;
  };

  let mockFeedback: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
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
      updateItem: vi.fn().mockResolvedValue(undefined),
    };

    mockFeedback = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EventEditorContainer, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: OrgDialogService, useValue: mockDialogs },
        { provide: EventService, useValue: mockEventService },
        { provide: ItemService, useValue: mockItemService },
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
        { provide: FeedbackService, useValue: mockFeedback },
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

    it('saves the changes of the owner and goes back to Meus eventos', async () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      await component['saveEvent']();
      expect(mockEventService.updateEvent).toHaveBeenCalledWith(
        'evt-123',
        expect.objectContaining({
          title: 'Festa Junina',
          createdBy: 'owner-uid',
        }),
      );
      expect(mockFeedback.success).toHaveBeenCalledWith('Evento atualizado!');
      expect(navigate).toHaveBeenCalledWith(['/meus-eventos']);
    });

    it('fills the address fields of an older event from its one-line location', () => {
      mockEventService.getEvent.mockReturnValue(
        of({ ...mockOwnerEvent, addressDetails: undefined }),
      );
      fixture = TestBed.createComponent(EventEditorContainer);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('id', 'evt-123');
      fixture.detectChanges();

      expect(component['addressForm'].getRawValue()).toEqual({
        cep: '01001-000',
        address: 'Rua das Flores',
        number: '100',
        neighborhood: 'Centro',
        city: 'São Paulo/SP',
      });
      expect(component['missingSteps']()).toEqual([]);

      component['addressForm'].controls.number.setValue('');
      expect(component['missingSteps']()).toEqual(['Endereço']);
    });

    it('opens a typed collaborator drawer for the event owner', () => {
      const drawer = TestBed.inject(DrawerService);
      component['openCollaboratorsDialog']();
      expect(drawer.drawerType()).toBe('collaborator');
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
      expect(mockFeedback.info).toHaveBeenCalledWith(
        expect.stringContaining('Apenas o organizador principal pode salvar alterações'),
      );
    });

    it('should allow collaborator to add and delete items', async () => {
      await component['addItem']({ name: 'Refrigerante', quantity: 3 });

      expect(mockItemService.addItem).toHaveBeenCalledWith('evt-123', {
        name: 'Refrigerante',
        quantity: 3,
      });

      component['items'].set([{ id: 'item-99', name: 'Pastel', quantity: 2, claimedBy: null }]);
      await component['updateItem']({
        index: 0,
        item: { name: 'Pastel de queijo', quantity: 4, unit: 'un.' },
      });
      expect(mockItemService.updateItem).toHaveBeenCalledWith('evt-123', 'item-99', {
        name: 'Pastel de queijo',
        quantity: 4,
        unit: 'un.',
      });

      await component['removeItem'](0);

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

    it('has four steps, with the optional items step before Pix', () => {
      const stepper = fixture.debugElement.query(By.directive(MatStepper))
        .componentInstance as MatStepper;
      expect(stepper.steps.map((step) => step.label)).toEqual([
        'Informações',
        'Endereço',
        'Itens',
        'Pix',
      ]);
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('[data-testid="event-editor-step-3"]')).toBeTruthy();
      expect(element.querySelector('#pix-form [data-testid="event-save-btn"]')).toBeTruthy();
    });

    it('keeps items typed during creation and saves them with the new event', async () => {
      await component['addItem']({
        name: 'Pipoca',
        quantity: 50,
        unit: 'pacotes',
        fixedQuantity: true,
      });
      await component['addItem']({ name: 'Bolo', quantity: 2 });
      await component['removeItem'](1);
      expect(mockItemService.addItem).not.toHaveBeenCalled();
      expect(component['stepItems']()).toEqual([
        { name: 'Pipoca', quantity: 50, unit: 'pacotes', fixedQuantity: true },
      ]);

      const date = new Date(Date.now() + 7 * 86_400_000);
      component['basicInfoForm'].setValue({
        title: 'Festa',
        category: 'Outros',
        description: 'Descrição',
        date,
        time: '20:00',
      });
      component['addressForm'].setValue({
        cep: '30514-160',
        address: 'Rua Dom Lara',
        neighborhood: 'Vista Alegre',
        city: 'Belo Horizonte/MG',
        number: '135',
      });
      await component['saveEvent']();

      expect(mockEventService.createEvent).toHaveBeenCalled();
      expect(mockItemService.addItem).toHaveBeenCalledWith('new-id', {
        name: 'Pipoca',
        quantity: 50,
        unit: 'pacotes',
        fixedQuantity: true,
      });
    });

    it('blocks step 1 right away for a date and time in the past or a typed non-date', () => {
      const form = component['basicInfoForm'];
      form.setValue({
        title: 'Festa',
        category: 'Outros',
        description: 'Arraiá com quentão',
        date: new Date(Date.now() - 86_400_000),
        time: '20:00',
      });
      expect(form.hasError('pastDateTime')).toBe(true);
      expect(form.invalid).toBe(true);

      form.controls.date.setValue(new Date(NaN));
      expect(form.controls.date.hasError('invalidDate')).toBe(true);

      form.controls.date.setValue(new Date(Date.now() + 7 * 86_400_000));
      expect(form.valid).toBe(true);
    });

    it('refuses markup in the title, a bad house number and an invalid Pix key', async () => {
      const date = new Date(Date.now() + 7 * 86_400_000);
      component['basicInfoForm'].setValue({
        title: '<script>Festa</script>',
        category: 'Outros',
        description: 'Arraiá com quentão',
        date,
        time: '20:00',
      });
      component['addressForm'].setValue({
        cep: '30514-160',
        address: 'Rua Dom Lara',
        neighborhood: 'Vista Alegre',
        city: 'Belo Horizonte/MG',
        number: 'Casa 5',
      });
      component['pixForm'].setValue({ pixKey: 'chave qualquer' });

      expect(component['basicInfoForm'].controls.title.getError('valueObject')).toBe(
        'Não use os caracteres < > { }',
      );
      expect(component['addressForm'].controls.number.invalid).toBe(true);
      expect(component['pixForm'].controls.pixKey.invalid).toBe(true);

      await component['saveEvent']();
      expect(mockEventService.createEvent).not.toHaveBeenCalled();
    });

    it('saves a category typed by the organizer', async () => {
      component['basicInfoForm'].setValue({
        title: 'Festa',
        category: '  Chá   revelação ',
        description: 'Arraiá com quentão',
        date: new Date(Date.now() + 7 * 86_400_000),
        time: '20:00',
      });
      component['addressForm'].setValue({
        cep: '30514-160',
        address: 'Rua Dom Lara',
        neighborhood: 'Vista Alegre',
        city: 'Belo Horizonte/MG',
        number: '135',
      });
      await component['saveEvent']();

      expect(mockEventService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Chá revelação' }),
      );
    });

    it('saves tidied text and the CEP formatted', async () => {
      const date = new Date(Date.now() + 7 * 86_400_000);
      component['basicInfoForm'].setValue({
        title: '  Festa   Junina ',
        category: 'Outros',
        description: 'Arraiá com quentão',
        date,
        time: '20:00',
      });
      component['addressForm'].setValue({
        cep: '30514160',
        address: 'Rua Dom Lara',
        neighborhood: 'Vista Alegre',
        city: 'Belo Horizonte/MG',
        number: 's/n',
      });
      await component['saveEvent']();

      expect(mockEventService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Festa Junina',
          addressDetails: expect.objectContaining({ cep: '30514-160', number: 'S/N' }),
        }),
      );
    });
  });
});
