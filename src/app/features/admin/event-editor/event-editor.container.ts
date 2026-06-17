import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  input,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { Router } from '@angular/router';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { EventService, ItemService, GuestService, ConfettiService } from '../../../core/services';
import { LocationService } from '../../../core/services/location.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { PartyItem, Guest } from '../../../core/models';
import { SharePanelComponent } from './components/share-panel/share-panel.component';

@Component({
  selector: 'app-event-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isEditing = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly items = signal<PartyItem[]>([]);
  protected readonly guests = signal<Guest[]>([]);
  protected readonly newItemName = signal('');
  protected readonly newItemQuantity = signal(1);
  protected readonly eventUrl = signal('');

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    date: [null as Date | null, [Validators.required]],
    time: ['', [Validators.required]],
    cep: [''],
    address: ['', [Validators.required]],
    number: [''],
    pixKey: [''],
  });

  ngOnInit(): void {
    // ViaCEP listener
    this.form.controls.cep.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(cep => this.locationService.getViaCep(cep))
    ).subscribe(res => {
      if (res && !res.erro) {
        const addressText = `${res.logradouro} - ${res.bairro}, ${res.localidade}/${res.uf}`;
        this.form.controls.address.patchValue(addressText);
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
              description: event.description,
              date: d,
              time: timeStr,
              address: event.location, // Colocamos o location inteiro no address por legado
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
        }
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
    if (this.form.invalid) return;

    this.saving.set(true);
    const { title, description, date, time, cep, address, number, pixKey } = this.form.getRawValue();

    let finalDate = new Date();
    if (date) {
      finalDate = new Date(date);
      const [h, m] = time.split(':');
      finalDate.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
    }
    const dateStr = finalDate.toISOString();

    const location = number ? `${address}, ${number}` : address;
    const eventData = { title, description, date: dateStr, location, pixKey: pixKey || null };

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
    const rows = guestsList.map(g => {
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
}
