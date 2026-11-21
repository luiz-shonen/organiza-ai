import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OrgSurfaceComponent } from '../../../../shared/ui';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'success';
const TONES: readonly Tone[] = ['primary', 'secondary', 'tertiary', 'success'];

/**
 * A festive scene (bunting, balloons, a gift, confetti) that fills the room left under a short
 * card beside the share panel. Decorative only; it hides itself when there is too little room.
 */
@Component({
  selector: 'app-event-ornament',
  imports: [OrgSurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-ornament.component.html',
  styleUrl: './event-ornament.component.scss',
  host: { 'aria-hidden': 'true' },
})
export class EventOrnamentComponent {
  /** Flags hang from the bunting's curve: y = 18 + 104·t·(1 − t). */
  protected readonly flags = Array.from({ length: 11 }, (_, i) => {
    const x = 30 + i * 54;
    const t = x / 600;
    return {
      x,
      y: Math.round(18 + 104 * t * (1 - t)),
      tone: TONES[i % TONES.length],
      delay: `${-(i * 0.35).toFixed(2)}s`,
    };
  });

  protected readonly confetti = [
    [200, 70],
    [230, 120],
    [380, 82],
    [410, 140],
    [560, 92],
    [40, 92],
    [176, 170],
    [430, 196],
    [340, 100],
  ].map(([x, y], i) => ({
    x,
    y,
    tone: TONES[i % TONES.length],
    delay: `${-(i * 0.6).toFixed(1)}s`,
  }));

  protected readonly sparkles = [
    [250, 96],
    [356, 64],
    [60, 150],
    [548, 150],
  ].map(([x, y], i) => ({ x, y, delay: `${-(i * 0.8).toFixed(1)}s` }));
}
