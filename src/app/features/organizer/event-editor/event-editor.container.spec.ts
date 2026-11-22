import { FormDraftService } from '../../../core/services/form-draft.service';
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
import { PartyEvent, ViaCepResponse } from '../../../core/models';
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
    date: '2099-12-20T19:00:00.000Z',
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
    collaboratorEmails$: ReturnType<typeof vi.fn>;
    listPendingInvitations: ReturnType<typeof vi.fn>;
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
      collaboratorEmails$: vi.fn().mockReturnValue(of({})),
      listPendingInvitations: vi.fn().mockReturnValue(of([])),
      removeCollaborator: vi.fn().mockResolvedValue(undefined),
    };

    // Drafts live in localStorage: each test starts without one.
    localStorage.clear();
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
        noNumber: false,
        complement: '',
        directions: '',
      });
      expect(component['missingSteps']()).toEqual([]);

      component['addressForm'].controls.number.setValue('');
      expect(component['missingSteps']()).toEqual(['Endereço']);
    });

    it('?passo=amigo-oculto opens the amigo oculto step, not the step left open last time', () => {
      fixture = TestBed.createComponent(EventEditorContainer);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('id', 'evt-123');
      fixture.componentRef.setInput('passo', 'amigo-oculto');
      // Pix was the step open last time.
      TestBed.inject(FormDraftService).save(component['stepKey'](), 4);
      fixture.detectChanges();

      expect(component['activeStepIndex']()).toBe(3);
    });

    it('does not edit an event that already happened: back to its page, saying why', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      mockEventService.getEvent.mockReturnValue(
        of({ ...mockOwnerEvent, date: '2020-12-24T20:00:00.000Z' }),
      );
      fixture = TestBed.createComponent(EventEditorContainer);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('id', 'evt-123');
      fixture.detectChanges();

      expect(mockFeedback.info).toHaveBeenCalledWith(
        'Este evento já aconteceu e não pode mais ser editado.',
      );
      expect(navigate).toHaveBeenCalledWith(['/evento', 'evt-123'], { replaceUrl: true });
      expect(component['basicInfoForm'].getRawValue().title).toBe('');
    });

    it('opens a typed collaborator drawer for the event owner', async () => {
      const drawer = TestBed.inject(DrawerService);
      component['openCollaboratorsDialog']();
      await vi.waitFor(() => expect(drawer.drawerType()).toBe('collaborator'));
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

    describe('a draft kept in the browser', () => {
      const reopen = () => {
        fixture.destroy();
        fixture = TestBed.createComponent(EventEditorContainer);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('id', 'novo');
        fixture.detectChanges();
      };
      const type = (title: string) => {
        const control = component['basicInfoForm'].controls.title;
        control.setValue(title);
        control.markAsDirty();
        fixture.detectChanges();
      };

      it('brings back what was typed after a reload, with items, until discarded', async () => {
        expect(component['restoredDraftAt']()).toBeNull();
        type('Natal da família');
        component['basicInfoForm'].patchValue({ date: new Date(2099, 11, 24) });
        await component['addItem']({ name: 'Farofa', quantity: 1 });
        fixture.detectChanges();

        reopen();
        expect(component['basicInfoForm'].controls.title.value).toBe('Natal da família');
        expect(component['basicInfoForm'].controls.date.value).toEqual(new Date(2099, 11, 24));
        expect(component['draftItems']().map((item) => item.name)).toEqual(['Farofa']);
        expect(component['restoredDraftAt']()).toBeInstanceOf(Date);
        expect(
          (fixture.nativeElement as HTMLElement).querySelector(
            '[data-testid="editor-draft-restored"]',
          ),
        ).toBeTruthy();

        component['discardDraft']();
        fixture.detectChanges();
        expect(component['basicInfoForm'].controls.title.value).toBe('');
        expect(component['draftItems']()).toEqual([]);
        reopen();
        expect(component['restoredDraftAt']()).toBeNull();
      });

      it('does not offer a draft that matches the event as it is', () => {
        const drafts = TestBed.inject(FormDraftService);
        drafts.save('event:new-creator-uid:novo', component['draftSnapshot']());
        reopen();
        expect(component['restoredDraftAt']()).toBeNull();
        expect(drafts.load('event:new-creator-uid:novo')).toBeNull();
      });

      it('keeps nothing when the form was only opened, or after "Cancelar"', () => {
        reopen();
        expect(component['restoredDraftAt']()).toBeNull();
        type('Churrasco');
        // "Cancelar" leaves for Meus eventos, a screen these tests do not route to.
        vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
        component['cancelEditing']();
        reopen();
        expect(component['basicInfoForm'].controls.title.value).toBe('');
      });

      it('is kept per account', () => {
        type('Natal da família');
        mockCurrentUserSignal.set({ uid: 'someone-else', email: 'other@test.com' });
        reopen();
        expect(component['basicInfoForm'].controls.title.value).toBe('');
      });
    });

    it('should compute isOwner as true for new event creation', () => {
      expect(component.isOwner()).toBe(true);
      expect(component['basicInfoForm'].enabled).toBe(true);
    });

    it('has five steps, with the optional items and amigo oculto steps before Pix', () => {
      const stepper = fixture.debugElement.query(By.directive(MatStepper))
        .componentInstance as MatStepper;
      expect(stepper.steps.map((step) => step.label)).toEqual([
        'Informações',
        'Endereço',
        'Itens',
        'Amigo oculto',
        'Pix',
      ]);
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('[data-testid="event-editor-step-3"]')).toBeTruthy();
      expect(element.querySelector('#pix-form [data-testid="event-save-btn"]')).toBeTruthy();
    });

    describe('an event over several days', () => {
      const fill = (endDate: Date | null) => {
        component['basicInfoForm'].patchValue({
          title: 'Retiro de fim de ano',
          category: 'Outros',
          description: '',
          date: new Date(2027, 11, 23),
          endDate,
          time: '17:00',
        });
        component['addressForm'].patchValue({
          cep: '30514-160',
          address: 'Rua Dom Lara',
          number: '135',
          neighborhood: 'Vista Alegre',
          city: 'Belo Horizonte/MG',
        });
      };

      it('saves the last day when it comes after the first', async () => {
        fill(new Date(2027, 11, 25));
        await component['saveEvent']();
        expect(mockEventService.createEvent).toHaveBeenCalledWith(
          expect.objectContaining({ endDate: '2027-12-25' }),
        );
      });

      it('saves no last day when it is empty or the same day', async () => {
        fill(new Date(2027, 11, 23));
        await component['saveEvent']();
        expect(mockEventService.createEvent).toHaveBeenLastCalledWith(
          expect.objectContaining({ endDate: null }),
        );
      });

      it('does not let the last day come before the first', () => {
        fill(new Date(2027, 11, 20));
        expect(component['basicInfoForm'].hasError('endBeforeStart')).toBe(true);
        fill(null);
        expect(component['basicInfoForm'].valid).toBe(true);
      });
    });

    describe('a rural address', () => {
      const lookup = (cep: string, found: Partial<ViaCepResponse> | null) => {
        component['addressForm'].controls.cep.setValue(cep, { emitEvent: false });
        component['applyCepLookup'](
          found
            ? { cep, logradouro: '', complemento: '', bairro: '', localidade: '', uf: '', ...found }
            : null,
        );
      };

      it('locks what the CEP filled and opens what it did not', () => {
        expect(component['addressFound']()).toBeNull();
        lookup('35830-000', { localidade: 'Jaboticatubas', uf: 'MG' });

        expect(component['addressForm'].getRawValue()).toMatchObject({
          address: '',
          neighborhood: '',
          city: 'Jaboticatubas/MG',
        });
        expect(component['addressFound']()).toEqual({
          address: false,
          neighborhood: false,
          city: true,
        });
      });

      it('keeps what the organizer typed, and clears what the last CEP filled', () => {
        lookup('30514-160', {
          logradouro: 'Rua Dom Lara',
          bairro: 'Vista Alegre',
          localidade: 'Belo Horizonte',
          uf: 'MG',
        });
        lookup('35830-000', { localidade: 'Jaboticatubas', uf: 'MG' });
        expect(component['addressForm'].getRawValue()).toMatchObject({
          address: '',
          neighborhood: '',
          city: 'Jaboticatubas/MG',
        });

        component['addressForm'].patchValue({ address: 'Estrada da Serra' });
        lookup('35830-000', { localidade: 'Jaboticatubas', uf: 'MG' });
        expect(component['addressForm'].controls.address.value).toBe('Estrada da Serra');
      });

      it('opens every field for a CEP the lookup does not know', () => {
        lookup('99999-999', null);
        expect(component['addressFound']()).toEqual({
          address: false,
          neighborhood: false,
          city: false,
        });
      });

      it('"Sem número" saves S/N, with the complement and directions', async () => {
        const form = component['addressForm'];
        form.controls.noNumber.setValue(true);
        expect(form.controls.number.disabled).toBe(true);
        expect(form.controls.number.value).toBe('S/N');
        expect(component['noNumberState']()).toEqual({ checked: true, disabled: false });

        component['basicInfoForm'].patchValue({
          title: 'Churrasco no sítio',
          category: 'Outros',
          description: '',
          date: new Date(Date.now() + 7 * 86_400_000),
          time: '12:00',
        });
        form.patchValue({
          cep: '35830-000',
          address: 'Estrada da Serra do Cipó',
          neighborhood: 'Zona rural',
          city: 'Jaboticatubas/MG',
          complement: ' Km 12, sítio Boa Vista ',
          directions: 'Depois da ponte, à direita.',
        });
        expect(form.valid).toBe(true);
        await component['saveEvent']();

        expect(mockEventService.createEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            location:
              'Estrada da Serra do Cipó, S/N - Zona rural - Jaboticatubas/MG - CEP: 35830-000',
            addressDetails: {
              cep: '35830-000',
              address: 'Estrada da Serra do Cipó',
              number: 'S/N',
              neighborhood: 'Zona rural',
              city: 'Jaboticatubas/MG',
              complement: 'Km 12, sítio Boa Vista',
              directions: 'Depois da ponte, à direita.',
            },
          }),
        );

        form.controls.noNumber.setValue(false);
        expect(form.controls.number.enabled).toBe(true);
        expect(form.controls.number.value).toBe('');
      });
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
      component['basicInfoForm'].patchValue({
        title: 'Festa',
        category: 'Outros',
        description: 'Descrição',
        date,
        time: '20:00',
      });
      component['addressForm'].patchValue({
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
      form.patchValue({
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

    it('accepts the event without a description', () => {
      component['basicInfoForm'].patchValue({
        title: 'Festa',
        category: 'Outros',
        description: '',
        date: new Date(Date.now() + 7 * 86_400_000),
        time: '20:00',
      });
      expect(component['basicInfoForm'].valid).toBe(true);
    });

    it('refuses markup in the title, a bad house number and an invalid Pix key', async () => {
      const date = new Date(Date.now() + 7 * 86_400_000);
      component['basicInfoForm'].patchValue({
        title: '<script>Festa</script>',
        category: 'Outros',
        description: 'Arraiá com quentão',
        date,
        time: '20:00',
      });
      component['addressForm'].patchValue({
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
      component['basicInfoForm'].patchValue({
        title: 'Festa',
        category: '  Chá   revelação ',
        description: 'Arraiá com quentão',
        date: new Date(Date.now() + 7 * 86_400_000),
        time: '20:00',
      });
      component['addressForm'].patchValue({
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
      component['basicInfoForm'].patchValue({
        title: '  Festa   Junina ',
        category: 'Outros',
        description: 'Arraiá com quentão',
        date,
        time: '20:00',
      });
      component['addressForm'].patchValue({
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
