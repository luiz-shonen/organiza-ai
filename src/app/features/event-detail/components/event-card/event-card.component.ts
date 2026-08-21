import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { PartyEvent } from '../../../../core/models/event.model';
import { OrgIconComponent, OrgSurfaceComponent } from '../../../../shared/ui';

@Component({
  selector: 'app-event-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TitleCasePipe, OrgIconComponent, OrgSurfaceComponent],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss',
})
export class EventCardComponent {
  public event = input.required<PartyEvent>();
  public guestCount = input<number>(0);
  public isOwner = input<boolean>(true);

  public googleCalendarUrl = computed(() => {
    const ev = this.event();
    if (!ev) return '#';
    const dateStr = new Date(ev.date).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDateStr = new Date(new Date(ev.date).getTime() + 4 * 60 * 60 * 1000)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${dateStr}/${endDateStr}&details=${encodeURIComponent(ev.description)}&location=${encodeURIComponent(ev.location)}`;
  });
}
