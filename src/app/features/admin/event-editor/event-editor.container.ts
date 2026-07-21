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
import { EventService, ItemService, GuestService } from '../../../core/services';
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
    SharePanelComponent,
  ],
  templateUrl: './event-editor.container.html',
  styleUrl: './event-editor.container.scss',
})
export class EventEditorContainer implements OnInit {
  readonly id = input<string>();

  private readonly eventService = inject(EventService);
  private readonly itemService = inject(ItemService);
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
    date: ['', [Validators.required]],
    location: ['', [Validators.required]],
    pixKey: [''],
  });

  ngOnInit(): void {
    const eventId = this.id();
    if (eventId && eventId !== 'novo') {
      this.isEditing.set(true);
      this.loading.set(true);
      this.eventUrl.set(`${location.origin}/evento/${eventId}`);

      const eventSub = this.eventService.getEvent(eventId).subscribe({
        next: (event) => {
          if (event) {
            this.form.patchValue({
              title: event.title,
              description: event.description,
              date: event.date,
              location: event.location,
              pixKey: event.pixKey ?? '',
            });
          }
          this.loading.set(false);
        },
      });

      const itemsSub = this.itemService.listItems(eventId).subscribe({
        next: (items) => this.items.set(items),
      });

      const guestsSub = inject(GuestService).listGuests(eventId).subscribe({
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

    try {
      const formValue = this.form.getRawValue();
      const data = {
        title: formValue.title,
        description: formValue.description,
        date: formValue.date,
        location: formValue.location,
        pixKey: formValue.pixKey || null,
      };

      const eventId = this.id();
      if (this.isEditing() && eventId) {
        await this.eventService.updateEvent(eventId, data);
        this.snackBar.open('Evento atualizado!', 'OK', { duration: 3000 });
      } else {
        const newId = await this.eventService.createEvent(data);
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
