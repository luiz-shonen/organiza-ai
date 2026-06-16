import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PartyEvent } from '../../../../core/models';

@Component({
  selector: 'app-event-info-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule],
  template: `
    <mat-card class="info-card" appearance="outlined">
      <mat-card-header>
        <mat-icon matCardAvatar class="info-card__icon">info</mat-icon>
        <mat-card-title>Sobre o Evento</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p class="info-card__description">{{ event().description }}</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .info-card {
      &__icon {
        background-color: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 24px;
      }

      &__description {
        font-size: 1rem;
        line-height: 1.6;
        white-space: pre-line;
        margin: 8px 0 0;
      }
    }
  `,
})
export class EventInfoCardComponent {
  readonly event = input.required<PartyEvent>();
}
