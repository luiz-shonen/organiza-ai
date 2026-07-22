import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  input,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HeaderService } from '../../../core/services';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { EventService, ItemService, GuestService, ConfettiService } from '../../../core/services';
import { LocationService } from '../../../core/services/location.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { PartyItem, Guest } from '../../../core/models';
import { SharePanelComponent } from './components/share-panel/share-panel.component';

@Component({
  selector: 'app-event-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatChipsModule,
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isEditing = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly minDate = new Date();
  protected readonly items = signal<PartyItem[]>([]);
  protected readonly guests = signal<Guest[]>([]);
  protected readonly newItemName = signal('');
  protected readonly newItemQuantity = signal(1);
  protected readonly eventUrl = signal('');
  protected readonly categories = [
    { name: 'Aniversário', class: 'cat-aniversario' },
    { name: 'Casamento', class: 'cat-casamento' },
    { name: 'Festa Junina', class: 'cat-festa' },
    { name: 'Churrasco', class: 'cat-churrasco' },
    { name: 'Happy Hour', class: 'cat-happy' },
    { name: 'Formatura', class: 'cat-formatura' },
    { name: 'Outros', class: 'cat-outros' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    category: ['', [Validators.required]],
    description: ['', [Validators.required]],
    date: [null as Date | null, [Validators.required]],
    time: ['', [Validators.required]],
    cep: [''],
    address: ['', [Validators.required]],
    neighborhood: [''],
    city: [''],
    number: [''],
    pixKey: [''],
  });

  ngOnInit(): void {
    // ViaCEP listener
    this.form.controls.cep.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((cep) => this.locationService.getViaCep(cep)),
      )
      .subscribe((res) => {
        if (res && !res.erro) {
          this.form.patchValue({
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
            let d = new Date(event.date);
            if (isNaN(d.getTime())) d = new Date();
            const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

            this.form.patchValue({
              title: event.title,
              category: event.category || '',
              description: event.description,
              date: d,
              time: timeStr,
              address: event.location, // Colocamos o location inteiro no address por legado
              neighborhood: '',
              city: '',
              cep: '',
              number: '',
              pixKey: event.pixKey ?? '',
            });
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.snackBar.open('Erro ao carregar evento', 'OK', { duration: 3000 });
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const {
      title,
      category,
      description,
      date,
      time,
      cep,
      address,
      neighborhood,
      city,
      number,
      pixKey,
    } = this.form.getRawValue();

    let finalDate = new Date();
    if (date) {
      finalDate = new Date(date);
      const [h, m] = time.split(':');
      finalDate.setHours(Number(h) || 0, Number(m) || 0, 0, 0);

      if (finalDate < new Date()) {
        this.snackBar.open('A data e hora do evento não podem ser no passado.', 'OK', {
          duration: 3000,
        });
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

    const location = fullAddress || '';
    const eventData = {
      title,
      category,
      description,
      date: dateStr,
      location,
      pixKey: pixKey || null,
    };

    try {
      const eventId = this.id();
      if (this.isEditing() && eventId) {
        await this.eventService.updateEvent(eventId, eventData);
        this.snackBar.open('Evento atualizado!', 'OK', { duration: 3000 });
      } else {
        const newId = await this.eventService.createEvent(eventData);
        this.confetti.fireSuccessConfetti();
        this.snackBar.open('Evento criado com sucesso!', '🎉', { duration: 3000 });
        await this.router.navigate(['/admin/evento', newId]);
      }
    } catch {
      this.snackBar.open('Erro ao salvar evento.', 'OK', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
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
      this.snackBar.open('Erro ao adicionar item.', 'OK', { duration: 3000 });
    }
  }

  protected async removeItem(item: PartyItem): Promise<void> {
    const eventId = this.id();
    if (!eventId) return;

    try {
      await this.itemService.deleteItem(eventId, item.id);
    } catch {
      this.snackBar.open('Erro ao remover item.', 'OK', { duration: 3000 });
    }
  }

  protected exportToCsv(): void {
    const guestsList = this.guests();
    if (!guestsList.length) {
      this.snackBar.open('Nenhum convidado para exportar.', 'OK', { duration: 3000 });
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
    link.download = `convidados-${this.form.controls.title.value || 'evento'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  protected printList(): void {
    window.print();
  }

  protected formatCep(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
    this.form.controls.cep.setValue(value, { emitEvent: false });
  }

  protected formatDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2);
    if (value.length > 5) value = value.substring(0, 5) + '/' + value.substring(5, 9);

    // update value only in the raw input visually to not mess with matDatepicker internals prematurely
    input.value = value;
  }
}
