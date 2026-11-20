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
  ConfettiService,
  HeaderService,
  AuthService,
  UserService,
  GuestService,
  SecretSantaService,
} from '../../../core/services';
import { LocationService } from '../../../core/services/location.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { formatCep, hasStarted, parseLocation, splitGuestsByApproval } from '../../../core/utils';
import {
  AddressNumber,
  Cep,
  EventCategory,
  EventDescription,
  EventTitle,
  PixKey,
  notInPast,
  validDate,
  requiredText,
  valueObjectValidator,
} from '../../../core/value-objects';
import {
  ADDRESS_COMPLEMENT_MAX,
  ADDRESS_DIRECTIONS_MAX,
  AddressFound,
  EVENT_CATEGORIES,
  Guest,
  NewPartyItem,
  PartyEvent,
  PartyItem,
  SecretSantaParticipant,
  SecretSantaParticipantInput,
  SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
  ViaCepResponse,
} from '../../../core/models';
import { EventAddressStepComponent } from './components/event-address-step/event-address-step.component';
import { EventBasicInfoStepComponent } from './components/event-basic-info-step/event-basic-info-step.component';
import {
  EventItemsStepComponent,
  type ItemUpdate,
} from './components/event-items-step/event-items-step.component';
import { EventPixStepComponent } from './components/event-pix-step/event-pix-step.component';
import {
  EventSecretSantaStepComponent,
  type SecretSantaParticipantUpdate,
  type SecretSantaSuggestion,
} from './components/event-secret-santa-step/event-secret-santa-step.component';
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

/** Firestore puts the code in the message ("Missing or insufficient permissions." is permission-denied). */
function saveErrorMessage(error: unknown): string {
  const text =
    error instanceof Error ? `${(error as { code?: string }).code ?? ''} ${error.message}` : '';
  if (/permission-denied|insufficient permissions/i.test(text)) {
    return 'Sua conta não tem permissão para salvar este evento.';
  }
  if (/unavailable|network/i.test(text)) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  return 'Erro ao salvar evento. Tente novamente.';
}

@Component({
  selector: 'app-event-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EventAddressStepComponent,
    EventBasicInfoStepComponent,
    EventItemsStepComponent,
    EventPixStepComponent,
    EventSecretSantaStepComponent,
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
  private readonly confetti = inject(ConfettiService);
  protected readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  private readonly drawerService = inject(DrawerService);
  private readonly dialogs = inject(OrgDialogService);
  private readonly headerService = inject(HeaderService);
  protected readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly guestService = inject(GuestService);
  private readonly secretSantaService = inject(SecretSantaService);

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isEditing = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly minDate = new Date();
  protected readonly currentEvent = signal<PartyEvent | null>(null);
  protected readonly items = signal<PartyItem[]>([]);
  protected readonly eventUrl = signal('');
  protected readonly activeStepIndex = signal(0);
  protected readonly stepLabels = [
    'Informações',
    'Endereço',
    'Itens',
    'Amigo oculto',
    'Pix',
  ] as const;
  /** Items typed while creating the event; saved right after the event exists. */
  protected readonly draftItems = signal<NewPartyItem[]>([]);
  protected readonly stepItems = computed<readonly NewPartyItem[]>(() =>
    this.isEditing() ? this.items() : this.draftItems(),
  );
  /** "Os convidados vão levar alguma coisa?": on by itself when the event already has items. */
  protected readonly itemsEnabled = signal(false);
  protected readonly categories = EVENT_CATEGORIES;

  /** "Vai ter amigo oculto?" and "Incluir opções de presente", saved with the event. */
  protected readonly secretSantaEnabled = signal(false);
  protected readonly secretSantaGiftOptions = signal(false);
  protected readonly secretSantaMaxGifts = signal(SECRET_SANTA_DEFAULT_GIFT_OPTIONS);
  /** "Aprovar quem confirma pelo link": off by default. */
  protected readonly requireApproval = signal(false);
  private readonly savedParticipants = signal<SecretSantaParticipant[]>([]);
  /** Participants typed while creating the event; saved right after the event exists. */
  protected readonly draftParticipants = signal<SecretSantaParticipantInput[]>([]);
  protected readonly stepParticipants = computed<readonly SecretSantaParticipantInput[]>(() =>
    this.isEditing() ? this.savedParticipants() : this.draftParticipants(),
  );
  private readonly guests = signal<Guest[]>([]);
  /** The owner already drew: changing the list asks for a new draw. */
  protected readonly secretSantaDrawn = signal(false);
  private drawWatched = false;
  private secretSantaLoaded = false;
  private itemsLoaded = false;

  /** Confirmed guests, their relatives and companions not yet in the amigo oculto. */
  protected readonly secretSantaSuggestions = computed<SecretSantaSuggestion[]>(() => {
    const taken = new Set(this.stepParticipants().map((p) => p.guestId ?? ''));
    const names = new Set(this.stepParticipants().map((p) => p.name.trim().toLowerCase()));
    const people: SecretSantaSuggestion[] = [];
    // Guests still waiting for approval are not offered.
    const { approved } = splitGuestsByApproval(
      this.guests(),
      !!this.currentEvent()?.requireApproval,
    );
    for (const guest of approved) {
      people.push({ guestId: guest.id, name: guest.name, phone: guest.phone ?? '' });
      (guest.companions ?? []).forEach((companion, i) =>
        people.push({ guestId: `${guest.id}#${i}`, name: companion.name, phone: '' }),
      );
    }
    return people.filter(
      (p) => p.name.trim() && !taken.has(p.guestId) && !names.has(p.name.trim().toLowerCase()),
    );
  });

  public readonly isOwner = computed(() => {
    if (!this.isEditing()) return true;
    const ev = this.currentEvent();
    if (!ev || !ev.createdBy) return true;
    const currentUid = this.authService.currentUser()?.uid;
    return ev.createdBy === currentUid;
  });

  protected readonly basicInfoForm = this.fb.nonNullable.group(
    {
      title: ['', [requiredText, valueObjectValidator(EventTitle.validate)]],
      category: ['', [requiredText, valueObjectValidator(EventCategory.validate)]],
      // Optional: an event can go out with just a title, date and place.
      description: ['', [valueObjectValidator(EventDescription.validate)]],
      date: [null as Date | null, [Validators.required, validDate]],
      time: ['', [Validators.required]],
    },
    { validators: notInPast() },
  );

  protected readonly addressForm = this.fb.nonNullable.group({
    cep: ['', [requiredText, valueObjectValidator(Cep.validate)]],
    address: ['', [requiredText]],
    // Optional: a rural CEP often has no neighbourhood, and then the organizer may leave it out.
    neighborhood: [''],
    city: ['', [requiredText]],
    number: ['', [requiredText, valueObjectValidator(AddressNumber.validate)]],
    noNumber: [false],
    complement: ['', [Validators.maxLength(ADDRESS_COMPLEMENT_MAX)]],
    directions: ['', [Validators.maxLength(ADDRESS_DIRECTIONS_MAX)]],
  });
  /** Which fields the CEP filled (locked); null until a full CEP was looked up. */
  protected readonly addressFound = signal<AddressFound | null>(null);
  /** "Sem número" as the step shows it: ticked, and whether it can be changed. */
  protected readonly noNumberState = signal({ checked: false, disabled: false });

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
      .subscribe((res) => this.applyCepLookup(res));
    this.addressForm.controls.noNumber.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncNoNumber());

    const eventId = this.id();
    if (eventId && eventId !== 'novo') {
      this.isEditing.set(true);
      this.loading.set(true);
      this.eventUrl.set(`${location.origin}/evento/${eventId}`);

      const eventSub = this.eventService.getEvent(eventId).subscribe({
        next: (event) => {
          // An event that already happened is history: it is no longer edited.
          if (event && hasStarted(event.date)) {
            this.feedback.info('Este evento já aconteceu e não pode mais ser editado.');
            void this.router.navigate(['/evento', eventId], { replaceUrl: true });
            return;
          }
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

            // Older events only have the one-line location; split it into the fields.
            const saved = event.addressDetails;
            const details = saved?.address || saved?.city ? saved : parseLocation(event.location);
            this.addressForm.patchValue({
              cep: details.cep || '',
              address: details.address || '',
              number: details.number || '',
              neighborhood: details.neighborhood || '',
              city: details.city || '',
              noNumber: details.number === 'S/N',
              complement: saved?.complement ?? '',
              directions: saved?.directions ?? '',
            });

            this.pixForm.patchValue({
              pixKey: event.pixKey ?? '',
            });

            // Read once: a later snapshot of the event must not undo switches not saved yet.
            if (!this.secretSantaLoaded) {
              this.secretSantaLoaded = true;
              this.secretSantaEnabled.set(event.secretSanta?.enabled ?? false);
              this.requireApproval.set(event.requireApproval ?? false);
              this.secretSantaGiftOptions.set(event.secretSanta?.giftOptions ?? false);
              this.secretSantaMaxGifts.set(
                event.secretSanta?.maxGiftOptions ?? SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
              );
            }

            const isEventOwner =
              !event.createdBy || event.createdBy === this.authService.currentUser()?.uid;
            // Only the owner may read the draw; it tells whether the list changed after it.
            if (isEventOwner && !this.drawWatched) {
              this.drawWatched = true;
              const drawSub = this.secretSantaService.watchDraw(eventId).subscribe({
                next: (draw) => this.secretSantaDrawn.set(!!draw),
                error: () => this.secretSantaDrawn.set(false),
              });
              this.destroyRef.onDestroy(() => drawSub.unsubscribe());
            }

            if (!isEventOwner) {
              this.basicInfoForm.disable();
              this.addressForm.disable();
              this.pixForm.disable();
            } else {
              this.basicInfoForm.enable();
              this.addressForm.enable();
              this.pixForm.enable();
            }
            this.syncNoNumber();
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
        next: (items) => {
          this.items.set(items);
          // Only the first list sets the question; later ones follow what the organizer chose.
          if (!this.itemsLoaded) {
            this.itemsLoaded = true;
            if (items.length) this.itemsEnabled.set(true);
          }
        },
      });

      const participantsSub = this.secretSantaService.listParticipants(eventId).subscribe({
        next: (participants) => this.savedParticipants.set(participants),
        error: () => this.savedParticipants.set([]),
      });

      const guestsSub = this.guestService.listGuests(eventId).subscribe({
        next: (guests) => this.guests.set(guests),
        error: () => this.guests.set([]),
      });

      this.destroyRef.onDestroy(() => {
        eventSub.unsubscribe();
        itemsSub.unsubscribe();
        participantsSub.unsubscribe();
        guestsSub.unsubscribe();
      });
    }
  }

  /** Steps that still block saving, named as in the stepper. */
  protected missingSteps(): string[] {
    const missing: string[] = [];
    if (this.basicInfoForm.invalid) missing.push(this.stepLabels[0]);
    if (this.addressForm.invalid) missing.push(this.stepLabels[1]);
    if (this.pixForm.invalid) missing.push(this.stepLabels[4]);
    return missing;
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
      complement: rawAddress.complement.trim(),
      directions: rawAddress.directions.trim(),
    };

    const location = fullAddress || '';
    const user = this.authService.currentUser();
    // The profile name ("Luiz Rodrigues"); an e-mail account has no displayName of its own.
    const profileName = user ? (await this.userService.getProfile(user.uid))?.name?.trim() : '';
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
      creatorName: profileName || user?.displayName || this.currentEvent()?.creatorName || '',
      collaborators: this.currentEvent()?.collaborators ?? [],
      requireApproval: this.requireApproval(),
      secretSanta: {
        enabled: this.secretSantaEnabled(),
        giftOptions: this.secretSantaGiftOptions(),
        maxGiftOptions: this.secretSantaMaxGifts(),
        // Closing sign-ups is done on the event page; saving here keeps that choice.
        ...(this.currentEvent()?.secretSanta?.selfJoin === false ? { selfJoin: false } : {}),
      },
    };

    try {
      const eventId = this.id();
      if (this.isEditing() && eventId) {
        await this.eventService.updateEvent(eventId, eventData);
        this.feedback.success('Evento atualizado!');
        await this.router.navigate(['/meus-eventos']);
      } else {
        const newId = await this.eventService.createEvent(eventData);
        for (const item of this.draftItems()) {
          await this.itemService.addItem(newId, item);
        }
        this.draftItems.set([]);
        if (this.secretSantaEnabled()) {
          for (const participant of this.draftParticipants()) {
            await this.secretSantaService.addParticipant(newId, participant);
          }
        }
        this.draftParticipants.set([]);
        this.confetti.fireSuccessConfetti();
        this.feedback.success('Evento criado com sucesso!');
        await this.router.navigate(['/meus-eventos/evento', newId]);
      }
    } catch (error: unknown) {
      this.feedback.error(saveErrorMessage(error));
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

  /** Turning the question off with items on the list removes them, after asking. */
  protected async setItemsEnabled(enabled: boolean): Promise<void> {
    this.itemsEnabled.set(enabled);
    const items = this.stepItems();
    if (enabled || !items.length) return;

    const eventId = this.id();
    const saved = this.isEditing() && !!eventId;
    const count =
      items.length === 1 ? 'O item adicionado sai' : `Os ${items.length} itens adicionados saem`;
    const confirmed = await firstValueFrom(
      this.dialogs.confirm({
        title: 'Tirar a lista de itens?',
        message: saved
          ? `${count} da lista do evento, e quem já escolheu algum deixa de levá-lo.`
          : `${count} da lista deste evento.`,
        confirmLabel: 'Tirar itens',
        tone: 'danger',
      }),
    );
    if (!confirmed) {
      this.itemsEnabled.set(true);
      return;
    }
    if (!saved) {
      this.draftItems.set([]);
      return;
    }
    const results = await Promise.allSettled(
      this.items().map((item) => this.itemService.deleteItem(eventId, item.id)),
    );
    if (results.some((result) => result.status === 'rejected')) {
      this.itemsEnabled.set(true);
      this.feedback.error('Erro ao remover itens.');
    }
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

  protected async updateItem({ index, item }: ItemUpdate): Promise<void> {
    const eventId = this.id();
    if (!this.isEditing() || !eventId) {
      this.draftItems.update((items) => items.map((current, i) => (i === index ? item : current)));
      return;
    }
    const saved = this.items()[index];
    if (!saved) return;

    try {
      await this.itemService.updateItem(eventId, saved.id, item);
      this.feedback.success('Item atualizado');
    } catch {
      this.feedback.error('Erro ao atualizar item.');
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

  protected async addParticipant(participant: SecretSantaParticipantInput): Promise<void> {
    await this.addParticipants([participant]);
  }

  protected async addParticipants(
    participants: readonly SecretSantaParticipantInput[],
  ): Promise<void> {
    const eventId = this.id();
    if (!this.isEditing() || !eventId) {
      this.draftParticipants.update((list) => [...list, ...participants]);
      return;
    }
    try {
      for (const participant of participants) {
        await this.secretSantaService.addParticipant(eventId, participant);
      }
    } catch {
      this.feedback.error('Erro ao adicionar participante.');
    }
  }

  protected async updateParticipant({
    index,
    participant,
  }: SecretSantaParticipantUpdate): Promise<void> {
    const eventId = this.id();
    if (!this.isEditing() || !eventId) {
      this.draftParticipants.update((list) =>
        list.map((current, i) => (i === index ? participant : current)),
      );
      return;
    }
    const saved = this.savedParticipants()[index];
    if (!saved) return;
    try {
      await this.secretSantaService.updateParticipant(eventId, saved.id, participant);
      this.feedback.success('Participante atualizado');
    } catch {
      this.feedback.error('Erro ao atualizar participante.');
    }
  }

  protected async removeParticipant(index: number): Promise<void> {
    const eventId = this.id();
    const saved = this.isEditing() && eventId ? this.savedParticipants()[index] : null;
    const participant = saved ?? this.draftParticipants()[index];
    if (!participant) return;
    const confirmed = await firstValueFrom(
      this.dialogs.confirm({
        title: 'Remover participante',
        message: this.secretSantaDrawn()
          ? `${participant.name} sai do amigo oculto. O sorteio já foi feito: será preciso sortear de novo.`
          : `${participant.name} sai do amigo oculto deste evento.`,
        confirmLabel: 'Remover',
        tone: 'danger',
      }),
    );
    if (!confirmed) return;
    if (!saved || !eventId) {
      this.draftParticipants.update((list) => list.filter((_, i) => i !== index));
      return;
    }
    try {
      await this.secretSantaService.removeParticipant(eventId, saved.id);
    } catch {
      this.feedback.error('Erro ao remover participante.');
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

  /**
   * What ViaCEP found fills its field and stays locked; what it did not (a rural CEP has no
   * street) opens for the organizer to type. A CEP it does not know opens every field.
   */
  private applyCepLookup(res: ViaCepResponse | null): void {
    if (this.addressForm.controls.cep.value.replace(/\D/g, '').length !== 8) {
      this.addressFound.set(null);
      return;
    }
    const found = {
      address: res?.logradouro?.trim() ?? '',
      neighborhood: res?.bairro?.trim() ?? '',
      city: res?.localidade && res.uf ? `${res.localidade}/${res.uf}` : '',
    };
    const before = this.addressFound();
    const patch: Partial<Record<keyof AddressFound, string>> = {};
    for (const key of ['address', 'neighborhood', 'city'] as const) {
      if (found[key]) patch[key] = found[key];
      // A field the previous CEP filled is cleared; one the organizer typed is kept.
      else if (before?.[key]) patch[key] = '';
    }
    this.addressForm.patchValue(patch);
    this.addressFound.set({
      address: !!found.address,
      neighborhood: !!found.neighborhood,
      city: !!found.city,
    });
  }

  /** "Sem número" ticked: the number reads S/N and is not typed; unticked, it is typed again. */
  private syncNoNumber(): void {
    const { noNumber, number } = this.addressForm.controls;
    if (noNumber.value) {
      number.setValue('S/N', { emitEvent: false });
      number.disable({ emitEvent: false });
    } else if (number.disabled && noNumber.enabled) {
      number.enable({ emitEvent: false });
      if (number.value === 'S/N') number.setValue('');
    }
    this.noNumberState.set({ checked: noNumber.value, disabled: noNumber.disabled });
  }

  protected formatCep(value: string): void {
    const formattedValue = formatCep(value);
    if (formattedValue !== value) {
      this.addressForm.controls.cep.setValue(formattedValue);
    }
  }
}
