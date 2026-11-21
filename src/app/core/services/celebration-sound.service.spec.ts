import { TestBed } from '@angular/core/testing';
import { CelebrationSoundService } from './celebration-sound.service';

describe('CelebrationSoundService', () => {
  it('stays silent, without errors, where there is no Web Audio', () => {
    const original = (window as { AudioContext?: unknown }).AudioContext;
    delete (window as { AudioContext?: unknown }).AudioContext;
    try {
      const service = TestBed.inject(CelebrationSoundService);
      expect(() => service.play('Casamento')).not.toThrow();
    } finally {
      if (original) (window as { AudioContext?: unknown }).AudioContext = original;
    }
  });
});
