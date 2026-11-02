import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import {
  EventService,
  ItemService,
  GuestService,
  ConfettiService,
  HeaderService,
  AuthService,
} from '../../../core/services';
import { LocationService } from '../../../core/services/location.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { formatCep } from '../../../core/utils';
import {
  AddressNumber,
  Cep,
  EventCategory,
  EventDescription,
  EventTitle,
  PixKey,
  requiredText,
  valueObjectValidator,
} from '../../../core/value-objects';
import { EVENT_CATEGORIES, Guest, NewPartyItem, PartyEvent, PartyItem } from '../../../core/models';
import { EventAddressStepComponent } from './components/event-address-step/event-address-step.component';
import { EventBasicInfoStepComponent } from './components/event-basic-info-step/event-basic-info-step.component';
import { EventGuestsCardComponent } from './components/event-guests-card/event-guests-card.component';
import { EventItemsStepComponent } from './components/event-items-step/event-items-step.component';
import { EventPixStepComponent } from './components/event-pix-step/event-pix-step.component';
import { SharePanelComponent } from './components/share-panel/share-panel.component';
import {
  FeedbackService,
  OrgDialogService,
  OrgBannerComponent,
  OrgButtonComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  OrgSkeletonComponent,
  OrgStepComponent,
  OrgStepperComponent,
  OrgSurfaceComponent,
} from '../../../shared/ui';
import { DrawerService } from '../../../core/services/drawer.service';

@Component({
  selector: 'app-event-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EventAddressStepComponent,
    EventBasicInfoStepComponent,
    EventGuestsCardComponent,
    EventItemsStepComponent,
    EventPixStepComponent,
    OrgBannerComponent,
    OrgButtonComponent,
    OrgPageHeaderComponent,
    OrgPageLayoutComponent,
    OrgSkeletonComponent,
    OrgStepComponent,
    OrgStepperComponent,
    OrgSurfaceComponent,
    SharePanelComponent,
  ],
  templateUrl: './event-editor.container.html',
  styleUrl: './event-editor.container.scss',
})
export class EventEditorContainer implements OnInit {
  readonly id = input<string>();

  private readonly eventService = inject(EventService);
  private readonly itemService = inject(ItemService);
  private readonly locationService = inject(LocationService);
  private readonly guestService = inject(GuestService);
  private readonly confetti = inject(ConfettiService);
  protected readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  private readonly drawerService = inject(DrawerService);
  private readonly dialogs = inject(OrgDialogService);
  private readonly headerService = inject(HeaderService);
  protected readonly authService = inject(AuthService);

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isEditing = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly minDate = new Date();
  protected readonly currentEvent = signal<PartyEvent | null>(null);
  protected readonly items = signal<PartyItem[]>([]);
  protected readonly guests = signal<Guest[]>([]);
  protected readonly eventUrl = signal('');
  protected readonly activeStepIndex = signal(0);
  protected readonly stepLabels = ['Informações', 'Endereço', 'Itens', 'Pix'] as const;
  /** Items typed while creating the event; saved right after the event exists. */
  protected readonly draftItems = signal<NewPartyItem[]>([]);
  protected readonly stepItems = computed<readonly NewPartyItem[]>(() =>
    this.isEditing() ? this.items() : this.draftItems(),
  );
  protected readonly categories = EVENT_CATEGORIES;

  public readonly isOwner = computed(() => {
    if (!this.isEditing()) return true;
    const ev = this.currentEvent();
    if (!ev || !ev.createdBy) return true;
    const currentUid = this.authService.currentUser()?.uid;
    return ev.createdBy === currentUid;
  });

  protected readonly basicInfoForm = this.fb.nonNullable.group({
    title: ['', [requiredText, valueObjectValidator(EventTitle.validate)]],
    category: ['', [requiredText, valueObjectValidator(EventCategory.validate)]],
    description: ['', [requiredText, valueObjectValidator(EventDescription.validate)]],
    date: [null as Date | null, [Validators.required]],
    time: ['', [Validators.required]],
  });

  protected readonly addressForm = this.fb.nonNullable.group({
    cep: ['', [requiredText, valueObjectValidator(Cep.validate)]],
    address: ['', [requiredText]],
    neighborhood: ['', [requiredText]],
    city: ['', [requiredText]],
    number: ['', [requiredText, valueObjectValidator(AddressNumber.validate)]],
  });

  protected readonly pixForm = this.fb.nonNullable.group({
    pixKey: ['', [valueObjectValidator(PixKey.validate)]],
  });

  ngOnInit(): void {
    // ViaCEP listener
    this.addressForm.controls.cep.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((cep) => this.locationService.getViaCep(cep)),
      )
      .subscribe((res) => {
        if (res && !res.erro) {
          this.addressForm.patchValue({
            address: res.logradouro || '',
            neighborhood: res.bairro || '',
            city: res.localidade && res.uf ? `${res.localidade}/${res.uf}` : '',
          });
        }
      });

    const eventId = this.id();
    if (eventId && eventId !== 'novo') {
      this.isEditing.set(true);
      this.loading.set(true);
      this.eventUrl.set(`${location.origin}/evento/${eventId}`);

      const eventSub = this.eventService.getEvent(eventId).subscribe({
        next: (event) => {
          if (event) {
            this.currentEvent.set(event);
            let d = new Date(event.date);
            if (isNaN(d.getTime())) d = new Date();
            const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

            this.basicInfoForm.patchValue({
              title: event.title,
              category: event.category || '',
              description: event.description,
              date: d,
              time: timeStr,
            });

            this.addressForm.patchValue({
              cep: event.addressDetails?.cep || '',
              address: event.addressDetails?.address || event.location || '',
              number: event.addressDetails?.number || '',
              neighborhood: event.addressDetails?.neighborhood || '',
              city: event.addressDetails?.city || '',
            });

            this.pixForm.patchValue({
              pixKey: event.pixKey ?? '',
            });

            const isEventOwner =
              !event.createdBy || event.createdBy === this.authService.currentUser()?.uid;
            if (!isEventOwner) {
              this.basicInfoForm.disable();
              this.addressForm.disable();
              this.pixForm.disable();
            } else {
              this.basicInfoForm.enable();
              this.addressForm.enable();
              this.pixForm.enable();
            }
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.feedback.error('Erro ao carregar evento');
        },
      });

      const itemsSub = this.itemService.listItems(eventId).subscribe({
        next: (items) => this.items.set(items),
      });

      const guestsSub = this.guestService.listGuests(eventId).subscribe({
        next: (guests) => this.guests.set(guests),
      });

      this.destroyRef.onDestroy(() => {
        eventSub.unsubscribe();
        itemsSub.unsubscribe();
        guestsSub.unsubscribe();
      });
    }
  }

  protected async saveEvent(): Promise<void> {
    if (!this.isOwner()) {
      this.feedback.info('Apenas o organizador principal pode salvar alterações no evento.');
      return;
    }

    if (this.basicInfoForm.invalid || this.addressForm.invalid || this.pixForm.invalid) {
      this.basicInfoForm.markAllAsTouched();
      this.addressForm.markAllAsTouched();
      this.pixForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const raw = this.basicInfoForm.getRawValue();
    const { date, time } = raw;
    const category = EventCategory.create(raw.category)?.value ?? raw.category.trim();
    // The forms are valid here, so each value object exists; they save the tidied text.
    const title = EventTitle.create(raw.title)?.value ?? raw.title.trim();
    const description = EventDescription.create(raw.description)?.value ?? raw.description.trim();
    const rawAddress = this.addressForm.getRawValue();
    const { address, neighborhood, city } = rawAddress;
    const cep = Cep.create(rawAddress.cep)?.formatted ?? rawAddress.cep;
    const number = AddressNumber.create(rawAddress.number)?.value ?? rawAddress.number.trim();
    const pixKey = PixKey.create(this.pixForm.getRawValue().pixKey)?.value ?? '';

    let finalDate = new Date();
    if (date) {
      finalDate = new Date(date);
      const [h, m] = time.split(':');
      finalDate.setHours(Number(h) || 0, Number(m) || 0, 0, 0);

      if (finalDate < new Date()) {
        this.feedback.info('A data e hora do evento não podem ser no passado.');
        this.saving.set(false);
        return;
      }
    }
    const dateStr = finalDate.toISOString();

    const fullAddress = [
      address && number ? `${address}, ${number}` : address || number,
      neighborhood,
      city,
      cep ? `CEP: ${cep}` : '',
    ]
      .filter(Boolean)
      .join(' - ');

    const addressDetails = {
      cep,
      address,
      number,
      neighborhood,
      city,
    };

    const location = fullAddress || '';
    const user = this.authService.currentUser();
    const eventData = {
      title,
      category,
      description,
      date: dateStr,
      location,
      addressDetails,
      pixKey: pixKey || null,
      createdBy: user?.uid ?? '',
      creatorEmail: user?.email ?? '',
      collaborators: this.currentEvent()?.collaborators ?? [],
    };

    try {
      const eventId = this.id();
      if (this.isEditing() && eventId) {
        await this.eventService.updateEvent(eventId, eventData);
        this.feedback.success('Evento atualizado!');
      } else {
        const newId = await this.eventService.createEvent(eventData);
        for (const item of this.draftItems()) {
          await this.itemService.addItem(newId, item);
        }
        this.draftItems.set([]);
        this.confetti.fireSuccessConfetti();
        this.feedback.success('Evento criado com sucesso!');
        await this.router.navigate(['/meus-eventos/evento', newId]);
      }
    } catch {
      this.feedback.error('Erro ao salvar evento.');
    } finally {
      this.saving.set(false);
    }
  }

  protected openCollaboratorsDialog(): void {
    const eventId = this.id();
    const ev = this.currentEvent();
    if (!eventId || !ev) return;

    this.drawerService.open({
      kind: 'collaborator',
      data: {
        collaborators: ev.collaborators ?? [],
        pendingInvites: [],
      },
      onAction: async (action) => {
        if (action.action === 'invite') {
          try {
            await this.eventService.inviteCollaborator(
              eventId,
              action.email,
              ev.title,
              this.authService.currentUser()?.email || '',
            );
            this.feedback.success(`Convite enviado para ${action.email}`);
          } catch {
            this.feedback.error('Erro ao enviar convite.');
          }
          return;
        }
        const confirmed = await firstValueFrom(
          this.dialogs.confirm({
            title: 'Remover colaborador',
            message: `${action.collaboratorId} deixa de poder editar os itens e ver a lista de convidados deste evento.`,
            confirmLabel: 'Remover',
            tone: 'danger',
            icon: 'block',
          }),
        );
        if (!confirmed) return;
        try {
          await this.eventService.removeCollaborator(eventId, action.collaboratorId);
          this.feedback.success('Colaborador removido');
        } catch {
          this.feedback.error('Erro ao remover colaborador.');
        }
      },
    });
  }

  protected async addItem(item: NewPartyItem): Promise<void> {
    const eventId = this.id();
    if (!this.isEditing() || !eventId) {
      this.draftItems.update((items) => [...items, item]);
      return;
    }

    try {
      await this.itemService.addItem(eventId, item);
    } catch {
      this.feedback.error('Erro ao adicionar item.');
    }
  }

  protected async removeItem(index: number): Promise<void> {
    const eventId = this.id();
    const saved = this.isEditing() && !!eventId;
    const name = saved ? this.items()[index]?.name : this.draftItems()[index]?.name;
    if (!name) return;
    const confirmed = await firstValueFrom(
      this.dialogs.confirm({
        title: 'Remover item',
        message: saved
          ? `"${name}" sai da lista do evento, e quem já escolheu este item deixa de levá-lo.`
          : `"${name}" sai da lista de itens deste evento.`,
        confirmLabel: 'Remover item',
        tone: 'danger',
      }),
    );
    if (!confirmed) return;

    if (!saved) {
      this.draftItems.update((items) => items.filter((_, i) => i !== index));
      return;
    }
    const item = this.items()[index];
    if (!item) return;

    try {
      await this.itemService.deleteItem(eventId, item.id);
    } catch {
      this.feedback.error('Erro ao remover item.');
    }
  }

  protected cancelEditing(): void {
    void this.router.navigate(['/meus-eventos']);
  }

  protected async cancelEvent(): Promise<void> {
    const eventId = this.id();
    const event = this.currentEvent();
    if (!eventId || !event) return;
    this.dialogs
      .confirm({
        title: 'Cancelar evento',
        message: `Tem certeza que deseja cancelar o evento "${event.title}"? O link público vai avisar os convidados sobre o cancelamento.`,
        confirmLabel: 'Cancelar evento',
        cancelLabel: 'Manter evento',
        tone: 'danger',
        icon: 'cancel',
      })
      .subscribe(async (confirmed) => {
        if (!confirmed) return;
        try {
          await this.eventService.cancelEvent(eventId);
          this.feedback.success('Evento cancelado com sucesso!');
          await this.router.navigate(['/meus-eventos']);
        } catch {
          this.feedback.error('Erro ao cancelar evento.');
        }
      });
  }

  protected exportToCsv(): void {
    const guestsList = this.guests();
    if (!guestsList.length) {
      this.feedback.info('Nenhum convidado para exportar.');
      return;
    }

    const headers = ['Nome,Telefone,Data de Confirmação'];
    const rows = guestsList.map((g) => {
      const date = g.createdAt ? new Date(g.createdAt).toLocaleDateString('pt-BR') : '';
      return `"${g.name}","${g.phone}","${date}"`;
    });

    const csvContent = headers.concat(rows).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `convidados-${this.basicInfoForm.controls.title.value || 'evento'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  protected printList(): void {
    window.print();
  }

  protected formatCep(value: string): void {
    const formattedValue = formatCep(value);
    if (formattedValue !== value) {
      this.addressForm.controls.cep.setValue(formattedValue);
    }
  }
}
