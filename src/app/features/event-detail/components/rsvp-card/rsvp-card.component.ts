import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GuestSession } from '../../../../core/models';

@Component({
  selector: 'app-rsvp-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="rsvp-card" appearance="outlined">
      <mat-card-header>
        <mat-icon matCardAvatar class="rsvp-card__icon">how_to_reg</mat-icon>
        <mat-card-title>Confirme sua Presença</mat-card-title>
        <mat-card-subtitle>{{ guestCount() }} pessoa(s) confirmada(s)</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (session(); as s) {
          <p class="rsvp-card__status">
            <mat-icon class="rsvp-card__check">check_circle</mat-icon>
            Olá, <strong>{{ s.name }}</strong>! Presença confirmada.
          </p>
        } @else {
          <p class="rsvp-card__prompt">
            Informe seus dados para confirmar presença e participar da lista de itens.
          </p>
        }
      </mat-card-content>
      <mat-card-actions>
        <button
          mat-flat-button
          (click)="rsvpClicked.emit()"
          [attr.aria-label]="session() ? 'Editar dados de presença' : 'Confirmar presença'"
        >
          <mat-icon>{{ session() ? 'edit' : 'person_add' }}</mat-icon>
          {{ session() ? 'Editar Dados' : 'Confirmar Presença' }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .rsvp-card {
      &__icon {
        background-color: var(--mat-sys-tertiary-container);
        color: var(--mat-sys-on-tertiary-container);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 24px;
      }

      &__status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 8px 0 0;
        color: var(--mat-sys-on-surface);
      }

      &__check {
        color: #4caf50;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &__prompt {
        margin: 8px 0 0;
        color: var(--mat-sys-on-surface-variant);
      }
    }
  `,
})
export class RsvpCardComponent {
  readonly session = input<GuestSession | null>(null);
  readonly guestCount = input(0);
  readonly rsvpClicked = output<void>();
}
