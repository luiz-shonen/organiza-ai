import { revealFirstInvalidSoon } from '../../../shared/ui';
import { KnownPeopleService } from '../../../core/services/known-people.service';
import { personKey, type KnownPerson } from '../../../core/utils/known-people.utils';
import { explainError } from '../../../core/utils/error.utils';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { merge } from 'rxjs';
import { FormDraftService } from '../../../core/services/form-draft.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
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
import {
  formatCep,
  hasStarted,
  parseDay,
  parseLocation,
  splitGuestsByApproval,
  toDayString,
} from '../../../core/utils';
import {
  AddressNumber,
  Cep,
  EventCategory,
  EventDescription,
  EventTitle,
  PixKey,
  endNotBeforeStart,
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
/** The editor's steps as links name them (`?passo=…`), in the stepper's order. */
export const EDITOR_STEP_SLUGS = [
  'informacoes',
  'endereco',
  'itens',
  'amigo-oculto',
  'pix',
] as const;
export type EditorStepSlug = (typeof EDITOR_STEP_SLUGS)[number];

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
  /** `?passo=amigo-oculto`: a link that opens one step, whatever step was open last time. */
  readonly passo = input<string>();

  private readonly eventService = inject(EventService);
  private readonly itemService = inject(ItemService);
  private readonly locationService = inject(LocationService);
  private readonly confetti = inject(ConfettiService);
  protected readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly editorHost = inject<ElementRef<HTMLElement>>(ElementRef);
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
  /** "Aprovar presenças": off by default. */
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

  private readonly drafts = inject(FormDraftService);
  private readonly knownPeopleService = inject(KnownPeopleService);
  /** People the organizer knows from other events and family; read once the amigo oculto is on. */
  private readonly knownPeopleAll = signal<KnownPerson[]>([]);
  private knownPeopleRequested = false;
  /** Those not in this amigo oculto yet. */
  protected readonly knownPeople = computed(() => {
    const taken = new Set(this.stepParticipants().map((p) => personKey(p.name)));
    return this.knownPeopleAll().filter((person) => !taken.has(personKey(person.name)));
  });
  /** Bumped on every change in the three forms, so the draft effect sees typing. */
  private readonly formTick = signal(0);
  /** The editor as it was before the draft was applied: what "Descartar" goes back to. */
  private draftBaseline: EventEditorDraft | null = null;
  /** When the draft that was brought back had been saved; null when none was. */
  protected readonly restoredDraftAt = signal<Date | null>(null);
  /** The step is remembered only once the one from before the reload was brought back. */
  private stepRestored = false;
  private restoringStep = false;
  /** "Recuperamos o que você estava preenchendo (20/11 às 15:55)." and, below, what to do. */
  protected readonly draftMessage = computed(() => {
    const savedAt = this.restoredDraftAt();
    if (!savedAt) return '';
    const day = savedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const time = savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const when = `${day} às ${time}`;
    return `Recuperamos o que você estava preenchendo (${when}).\nSalve para não perder.`;
  });

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
      // Optional: empty is a one-day event.
      endDate: [null as Date | null, [validDate]],
      time: ['', [Validators.required]],
    },
    { validators: [notInPast(), endNotBeforeStart] },
  );

  protected readonly addressForm = this.fb.nonNullable.group({
    cep: ['', [requiredText, valueObjectValidator(Cep.validate)]],
    address: ['', [requiredText]],
    // Required: when the CEP does not bring it (a rural one), the organizer types it.
    neighborhood: ['', [requiredText]],
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

  constructor() {
    // What is typed is kept in this browser for three days, so a reload does not lose it.
    effect(() => {
      this.formTick();
      this.requireApproval();
      this.itemsEnabled();
      this.draftItems();
      this.secretSantaEnabled();
      this.secretSantaGiftOptions();
      this.secretSantaMaxGifts();
      this.draftParticipants();
      untracked(() => this.persistDraft());
    });
    // The people to offer are read the first time the amigo oculto is on, and only once.
    effect(() => {
      if (!this.secretSantaEnabled() || this.knownPeopleRequested) return;
      const uid = this.authService.currentUser()?.uid;
      if (!uid) return;
      this.knownPeopleRequested = true;
      void this.knownPeopleService
        .list(uid, this.id() === 'novo' ? null : this.id())
        .then((people) => this.knownPeopleAll.set(people))
        .catch(() => undefined);
    });
    // Where the organizer is, so a reload opens the same step.
    effect(() => {
      const step = this.activeStepIndex();
      untracked(() => {
        if (this.stepRestored && !this.restoringStep) this.drafts.save(this.stepKey(), step);
      });
    });
  }

  ngOnInit(): void {
    merge(this.basicInfoForm.valueChanges, this.addressForm.valueChanges, this.pixForm.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formTick.update((tick) => tick + 1));
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
              endDate: parseDay(event.endDate),
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
            // The first time the owner opens it: bring back what they had typed and not saved.
            if (isEventOwner && !this.draftBaseline) this.startDraft();
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.feedback.error(explainError('Não foi possível carregar o evento', err));
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
    } else {
      this.startDraft();
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
      // Open the first step with something missing and take the person to that field.
      this.activeStepIndex.set(
        this.basicInfoForm.invalid
          ? 0
          : this.addressForm.invalid
            ? 1
            : EDITOR_STEP_SLUGS.indexOf('pix'),
      );
      setTimeout(() => revealFirstInvalidSoon(this.editorHost.nativeElement), 250);
      return;
    }

    this.saving.set(true);

    const raw = this.basicInfoForm.getRawValue();
    const { date, endDate, time } = raw;
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
    // Saved only when the event runs past its first day; null clears an earlier last day.
    const lastDay = endDate ? toDayString(endDate) : '';
    const endDateStr = lastDay > toDayString(finalDate) ? lastDay : null;

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
      endDate: endDateStr,
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
        this.dropDraft();
        this.feedback.success('Evento atualizado!');
        await this.router.navigate(['/meus-eventos']);
      } else {
        const newId = await this.eventService.createEvent(eventData);
        this.dropDraft();
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
      this.feedback.error(explainError('Não foi possível salvar o evento', error));
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
          } catch (error) {
            this.feedback.error(explainError('Não foi possível enviar o convite', error));
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
        } catch (error) {
          this.feedback.error(explainError('Não foi possível remover o colaborador', error));
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
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) {
      this.itemsEnabled.set(true);
      this.feedback.error(explainError('Não foi possível remover os itens', failed.reason));
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
    } catch (error) {
      this.feedback.error(explainError('Não foi possível adicionar o item', error));
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
    } catch (error) {
      this.feedback.error(explainError('Não foi possível atualizar o item', error));
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
    } catch (error) {
      this.feedback.error(explainError('Não foi possível remover o item', error));
    }
  }

  /** Handed to the "Novo participante" form: it is cleared only once the person was added. */
  protected readonly saveNewParticipant = (participant: SecretSantaParticipantInput) =>
    this.addParticipants([participant]);

  protected async addParticipant(participant: SecretSantaParticipantInput): Promise<boolean> {
    return this.addParticipants([participant]);
  }

  /** True when every participant was added. */
  protected async addParticipants(
    participants: readonly SecretSantaParticipantInput[],
  ): Promise<boolean> {
    const eventId = this.id();
    if (!this.isEditing() || !eventId) {
      this.draftParticipants.update((list) => [...list, ...participants]);
      return true;
    }
    try {
      for (const participant of participants) {
        await this.secretSantaService.addParticipant(eventId, participant);
      }
      return true;
    } catch (error) {
      this.feedback.error(
        explainError(
          participants.length > 1
            ? 'Não foi possível adicionar os participantes'
            : 'Não foi possível adicionar o participante',
          error,
        ),
      );
      return false;
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
    } catch (error) {
      this.feedback.error(explainError('Não foi possível atualizar o participante', error));
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
    } catch (error) {
      this.feedback.error(explainError('Não foi possível remover o participante', error));
    }
  }

  protected cancelEditing(): void {
    // "Cancelar" is a choice to leave without saving: the draft goes too.
    this.dropDraft();
    void this.router.navigate(['/meus-eventos']);
  }

  /**
   * "Desfazer": back to the event as saved (or an empty form), and the draft is forgotten.
   * The ✕ of the banner only hides it; what was brought back stays.
   */
  protected discardDraft(): void {
    if (this.draftBaseline) this.applyDraft(this.draftBaseline);
    this.dropDraft();
    this.basicInfoForm.markAsPristine();
    this.addressForm.markAsPristine();
    this.pixForm.markAsPristine();
  }

  /** Where this editor's draft is kept: per account and per event ("novo" while creating). */
  private draftKey(): string {
    const uid = this.authService.currentUser()?.uid ?? 'anon';
    const eventId = this.id();
    return `event:${uid}:${eventId && eventId !== 'novo' ? eventId : 'novo'}`;
  }

  /** Remembers the editor as loaded, then applies a draft kept from an earlier visit. */
  private startDraft(): void {
    this.draftBaseline = this.draftSnapshot();
    const stored = this.drafts.load<EventEditorDraft>(this.draftKey());
    // A draft that matches the event as saved has nothing to bring back.
    if (stored && JSON.stringify(stored.value) === JSON.stringify(this.draftBaseline)) {
      this.drafts.clear(this.draftKey());
    } else if (stored) {
      this.applyDraft(stored.value);
      // It holds what was typed and not saved: it stays a draft until saved or discarded.
      this.basicInfoForm.markAsDirty();
      this.addressForm.markAsDirty();
      this.pixForm.markAsDirty();
      this.restoredDraftAt.set(new Date(stored.savedAt));
    }
    this.restoreStep();
  }

  /**
   * Back on the step the organizer was on before the reload. Creating an event, a step opens
   * only when the ones before it are filled in, as the stepper itself asks.
   */
  private restoreStep(): void {
    const asked = EDITOR_STEP_SLUGS.indexOf(this.passo() as EditorStepSlug);
    const saved = asked >= 0 ? asked : (this.drafts.load<number>(this.stepKey())?.value ?? 0);
    if (asked >= 0) {
      // Asked once: a reload from here opens the step the organizer moved to, not this one.
      this.location.replaceState(this.location.path().replace(/[?&]passo=[^&]*/, ''));
    }
    const last = this.stepLabels.length - 1;
    let step = Math.min(Math.max(Math.trunc(Number(saved)) || 0, 0), last);
    if (!this.isEditing()) {
      if (this.basicInfoForm.invalid) step = 0;
      else if (this.addressForm.invalid) step = Math.min(step, 1);
    }
    this.restoringStep = true;
    this.activeStepIndex.set(step);
    this.restoringStep = false;
    this.stepRestored = true;
  }

  private stepKey(): string {
    return `${this.draftKey()}:step`;
  }

  /**
   * Keeps the editor in the browser while the organizer changed it from how it was loaded.
   * Fields only count once typed in (dirty): the CEP lookup filling them is not a change.
   */
  private persistDraft(): void {
    const baseline = this.draftBaseline;
    if (!baseline) return;
    const snapshot = this.draftSnapshot();
    const typed = this.basicInfoForm.dirty || this.addressForm.dirty || this.pixForm.dirty;
    const compared = (draft: EventEditorDraft) =>
      JSON.stringify(typed ? draft : { ...draft, basicInfo: null, address: null, pixKey: null });
    if (compared(snapshot) === compared(baseline)) {
      this.drafts.clear(this.draftKey());
    } else {
      this.drafts.save(this.draftKey(), snapshot);
    }
  }

  private dropDraft(): void {
    this.drafts.clear(this.draftKey());
    this.drafts.clear(this.stepKey());
    this.restoredDraftAt.set(null);
    this.draftBaseline = this.draftSnapshot();
  }

  private draftSnapshot(): EventEditorDraft {
    const basic = this.basicInfoForm.getRawValue();
    const day = (date: Date | null) =>
      date instanceof Date && !isNaN(date.getTime()) ? date.toISOString() : null;
    return {
      basicInfo: { ...basic, date: day(basic.date), endDate: day(basic.endDate) },
      address: this.addressForm.getRawValue(),
      pixKey: this.pixForm.getRawValue().pixKey,
      requireApproval: this.requireApproval(),
      // Editing, items are saved as they are added, and the list loads on its own time.
      itemsEnabled: this.isEditing() ? false : this.itemsEnabled(),
      items: this.isEditing() ? [] : this.draftItems(),
      secretSanta: {
        enabled: this.secretSantaEnabled(),
        giftOptions: this.secretSantaGiftOptions(),
        maxGiftOptions: this.secretSantaMaxGifts(),
      },
      participants: this.isEditing() ? [] : this.draftParticipants(),
    };
  }

  private applyDraft(draft: EventEditorDraft): void {
    const day = (iso: string | null) => (iso ? new Date(iso) : null);
    this.basicInfoForm.patchValue({
      ...draft.basicInfo,
      date: day(draft.basicInfo.date),
      endDate: day(draft.basicInfo.endDate),
    });
    // The CEP first: its lookup locks what it fills, and the rest keeps what was typed.
    this.addressForm.patchValue(draft.address);
    this.pixForm.patchValue({ pixKey: draft.pixKey });
    this.requireApproval.set(draft.requireApproval);
    this.secretSantaEnabled.set(draft.secretSanta.enabled);
    this.secretSantaGiftOptions.set(draft.secretSanta.giftOptions);
    this.secretSantaMaxGifts.set(draft.secretSanta.maxGiftOptions);
    if (!this.isEditing()) {
      this.itemsEnabled.set(draft.itemsEnabled);
      this.draftItems.set([...draft.items]);
      this.draftParticipants.set([...draft.participants]);
    }
    this.syncNoNumber();
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
        } catch (error) {
          this.feedback.error(explainError('Não foi possível cancelar o evento', error));
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

/** What the editor keeps in the browser between visits (dates as ISO text). */
interface EventEditorDraft {
  basicInfo: {
    title: string;
    category: string;
    description: string;
    date: string | null;
    endDate: string | null;
    time: string;
  };
  address: {
    cep: string;
    address: string;
    neighborhood: string;
    city: string;
    number: string;
    noNumber: boolean;
    complement: string;
    directions: string;
  };
  pixKey: string;
  requireApproval: boolean;
  itemsEnabled: boolean;
  items: NewPartyItem[];
  secretSanta: { enabled: boolean; giftOptions: boolean; maxGiftOptions: number };
  participants: SecretSantaParticipantInput[];
}
