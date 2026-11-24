import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Balloons and confetti drifting slowly up the page, behind everything: the festive backdrop's
 * motion. Decorative only; nothing moves when the system asks for less motion.
 */
@Component({
  selector: 'org-party-drift',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-party-drift.component.html',
  styleUrl: './org-party-drift.component.scss',
  host: { 'aria-hidden': 'true' },
})
export class OrgPartyDriftComponent {
  protected readonly bits = [
    { shape: 'balloon', tone: 'primary', x: 8, delay: 0, duration: 14 },
    { shape: 'confetti', tone: 'secondary', x: 18, delay: -6, duration: 11 },
    { shape: 'balloon', tone: 'success', x: 27, delay: -3, duration: 16 },
    { shape: 'confetti', tone: 'tertiary', x: 38, delay: -9, duration: 12 },
    { shape: 'confetti', tone: 'primary', x: 62, delay: -2, duration: 13 },
    { shape: 'balloon', tone: 'tertiary', x: 72, delay: -8, duration: 15 },
    { shape: 'confetti', tone: 'success', x: 82, delay: -4, duration: 10 },
    { shape: 'balloon', tone: 'secondary', x: 91, delay: -11, duration: 17 },
  ] as const;
}
