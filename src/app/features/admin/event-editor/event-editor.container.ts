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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { PartyItem, Guest, PartyEvent } from '../../../core/models';
import { SharePanelComponent } from './components/share-panel/share-panel.component';
import {
  FeedbackService,
  OrgBannerComponent,
  OrgButtonComponent,
  OrgChipComponent,
  OrgDateFieldComponent,
  OrgIconButtonComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  OrgSectionComponent,
  OrgStepComponent,
  OrgStepperComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
  OrgTextareaFieldComponent,
  OrgTimeFieldComponent,
} from '../../../shared/ui';
import { DrawerService } from '../../../core/services/drawer.service';

@Component({
  selector: 'app-event-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatDialogModule,
    OrgBannerComponent,
    OrgButtonComponent,
    OrgChipComponent,
    OrgDateFieldComponent,
    OrgIconButtonComponent,
    OrgPageLayoutComponent,
    OrgPageHeaderComponent,
    OrgSurfaceComponent,
    OrgStepComponent,
    OrgStepperComponent,
    OrgTextFieldComponent,
    OrgTextareaFieldComponent,
    OrgTimeFieldComponent,
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
  private readonly headerService = inject(HeaderService);
  protected readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isEditing = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly minDate = new Date();
  protected readonly currentEvent = signal<PartyEvent | null>(null);
  protected readonly items = signal<PartyItem[]>([]);
  protected readonly guests = signal<Guest[]>([]);
  protected readonly newItemName = signal('');
  protected readonly newItemQuantity = signal(1);
  protected readonly eventUrl = signal('');
  protected readonly activeStepIndex = signal(0);
  protected readonly stepLabels = [
    'Informações do evento',
    'Endereço do evento',
    'Pagamento por Pix',
  ] as const;
  protected readonly categories = [
    { name: 'Aniversário', class: 'cat-aniversario' },
    { name: 'Casamento', class: 'cat-casamento' },
    { name: 'Festa Junina', class: 'cat-festa' },
    { name: 'Churrasco', class: 'cat-churrasco' },
    { name: 'Happy Hour', class: 'cat-happy' },
    { name: 'Formatura', class: 'cat-formatura' },
    { name: 'Outros', class: 'cat-outros' },
  ];

  public readonly isOwner = computed(() => {
    if (!this.isEditing()) return true;
    const ev = this.currentEvent();
    if (!ev || !ev.createdBy) return true;
    const currentUid = this.authService.currentUser()?.uid;
    return ev.createdBy === currentUid;
  });

  protected readonly basicInfoForm = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    category: ['', [Validators.required]],
    description: ['', [Validators.required]],
    date: [null as Date | null, [Validators.required]],
    time: ['', [Validators.required]],
  });

  protected readonly addressForm = this.fb.nonNullable.group({
    cep: ['', [Validators.required]],
    address: ['', [Validators.required]],
    neighborhood: ['', [Validators.required]],
    city: ['', [Validators.required]],
    number: ['', [Validators.required]],
  });

  protected readonly pixForm = this.fb.nonNullable.group({
    pixKey: [''],
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

    const { title, category, description, date, time } = this.basicInfoForm.getRawValue();
    const { cep, address, neighborhood, city, number } = this.addressForm.getRawValue();
    const { pixKey } = this.pixForm.getRawValue();

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
        try {
          await this.eventService.removeCollaborator(eventId, action.collaboratorId);
          this.feedback.success('Colaborador removido');
        } catch {
          this.feedback.error('Erro ao remover colaborador.');
        }
      },
    });
  }

  protected async addItem(): Promise<void> {
    const name = this.newItemName().trim();
    const quantity = this.newItemQuantity();
    const eventId = this.id();

    if (!name || !eventId) return;

    try {
      await this.itemService.addItem(eventId, { name, quantity });
      this.newItemName.set('');
      this.newItemQuantity.set(1);
    } catch {
      this.feedback.error('Erro ao adicionar item.');
    }
  }

  protected setNewItemQuantity(value: string): void {
    const quantity = Number(value);
    this.newItemQuantity.set(Number.isInteger(quantity) && quantity > 0 ? quantity : 1);
  }

  protected async removeItem(item: PartyItem): Promise<void> {
    const eventId = this.id();
    if (!eventId) return;

    try {
      await this.itemService.deleteItem(eventId, item.id);
    } catch {
      this.feedback.error('Erro ao remover item.');
    }
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
    let formattedValue = value.replace(/\D/g, '');
    if (formattedValue.length > 5) {
      formattedValue = formattedValue.substring(0, 5) + '-' + formattedValue.substring(5, 8);
    }
    if (formattedValue !== value) {
      this.addressForm.controls.cep.setValue(formattedValue);
    }
  }

  protected nextStep(stepper: OrgStepperComponent): void {
    stepper.next();
  }

  protected previousStep(stepper: OrgStepperComponent): void {
    stepper.previous();
  }

  protected selectCategory(category: string): void {
    this.basicInfoForm.controls.category.setValue(category);
    this.basicInfoForm.controls.category.markAsTouched();
  }
}
