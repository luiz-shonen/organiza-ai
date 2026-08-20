import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartyEvent } from '../../../../../core/models';

@Component({
  selector: 'app-organizer-event-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss',
})
export class EventCardComponent {
  public readonly event = input.required<PartyEvent>();
  public readonly isOwner = input<boolean>(true);

  public readonly edit = output<PartyEvent>();
  public readonly share = output<PartyEvent>();
  public readonly copyLink = output<PartyEvent>();
  public readonly cancel = output<PartyEvent>();
  public readonly select = output<PartyEvent>();

  public onCardClick(): void {
    this.select.emit(this.event());
  }

  public onEdit(e: Event): void {
    e.stopPropagation();
    this.edit.emit(this.event());
  }

  public onShare(e: Event): void {
    e.stopPropagation();
    this.share.emit(this.event());
  }

  public onCopyLink(e: Event): void {
    e.stopPropagation();
    this.copyLink.emit(this.event());
  }

  public onCancel(e: Event): void {
    e.stopPropagation();
    this.cancel.emit(this.event());
  }
}
