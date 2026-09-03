import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { PartyEvent, getCategoryClass } from '../../../../core/models';
import {
  OrgBadgeComponent,
  OrgBadgeVariant,
  OrgIconComponent,
  OrgSurfaceComponent,
} from '../../../../shared/ui';

@Component({
  selector: 'app-event-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TitleCasePipe, OrgBadgeComponent, OrgIconComponent, OrgSurfaceComponent],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss',
})
export class EventCardComponent {
  public event = input.required<PartyEvent>();
  public guestCount = input<number>(0);
  public isOwner = input<boolean>(true);

  public readonly categoryName = computed(() => {
    return this.event()?.category || 'Festa & Celebração';
  });

  public readonly categoryClass = computed(() => {
    return getCategoryClass(this.event()?.category);
  });

  public readonly categoryBadgeVariant = computed<OrgBadgeVariant>(() => {
    const cls = this.categoryClass();
    return (cls.startsWith('cat-') ? cls.slice(4) : cls) as OrgBadgeVariant;
  });

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
