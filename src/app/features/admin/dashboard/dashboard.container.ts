import { Component, ChangeDetectionStrategy, inject, OnInit, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { Clipboard } from '@angular/cdk/clipboard';
import { EventService, AuthService } from '../../../core/services';
import { PartyEvent } from '../../../core/models';
import { AdminFormDialogComponent } from './components/admin-form-dialog/admin-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './dashboard.container.html',
  styleUrl: './dashboard.container.scss',
})
export class DashboardContainer implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);
  private readonly dialog = inject(MatDialog);

  protected readonly events$ = this.eventService.listEvents();
  protected readonly isSuperAdmin = this.authService.isSuperAdmin;
  protected readonly user = this.authService.currentUser;
  protected readonly displayedColumns = ['title', 'date', 'location', 'actions'];

  ngOnInit(): void {}

  protected editEvent(event: PartyEvent): void {
    this.router.navigate(['/admin/evento', event.id]);
  }

  protected async deleteEvent(event: PartyEvent): Promise<void> {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir Evento',
        message: `Tem certeza que deseja excluir o evento "${event.title}"?`,
        confirmLabel: 'Excluir'
      }
    });

    confirmRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.eventService.deleteEvent(event.id);
          this.snackBar.open('Evento excluído com sucesso!', 'OK', { duration: 3000 });
        } catch {
          this.snackBar.open('Erro ao excluir evento.', 'OK', { duration: 3000 });
        }
      }
    });
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erro ao sair da conta', 'OK', { duration: 3000 });
    }
  }

  protected shareWhatsApp(event: PartyEvent): void {
    const url = `${location.origin}/evento/${event.id}`;
    const text = `🎉 Você está convidado(a) para *${event.title}*!\n\n📅 ${this.formatDate(event.date)}\n📍 ${event.location}\n\nConfirme sua presença e veja o que levar:\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }

  protected copyLink(event: PartyEvent): void {
    const url = `${location.origin}/evento/${event.id}`;
    this.clipboard.copy(url);
    this.snackBar.open('Link copiado!', 'OK', { duration: 2000 });
  }

  protected formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  protected openAdminDialog(): void {
    this.dialog.open(AdminFormDialogComponent, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'app-drawer-panel',
      position: { bottom: '0' },
      disableClose: false
    });
  }
}
