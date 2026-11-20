import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root',
})
export class ConfettiService {
  fireSuccessConfetti(): void {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#9775fa', '#40c057', '#4dabf7'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#9775fa', '#40c057', '#4dabf7'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }

  /**
   * A bigger party, for the amigo oculto reveal: a burst from the middle of the screen,
   * then streams from both sides for 4 seconds. Skipped when the system asks for less motion.
   */
  fireCelebration(): void {
    const colors = ['#9775fa', '#40c057', '#4dabf7', '#ffd43b', '#f06595'];
    confetti({
      particleCount: 140,
      spread: 100,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.35 },
      colors,
      disableForReducedMotion: true,
    });

    const end = Date.now() + 4000;
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }
}
