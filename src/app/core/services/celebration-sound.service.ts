import { Injectable } from '@angular/core';
import { inviteTheme, type InviteWordsKey } from '../utils/invite.utils';

/** One struck note: when (s), pitch (Hz), how long it rings (s), its voice and loudness. */
interface Note {
  readonly at: number;
  readonly freq: number;
  readonly dur: number;
  readonly voice: Voice;
  readonly gain?: number;
}

/** A burst of noise: sleigh bells, a popping cork, a firework's crackle. */
interface Noise {
  readonly at: number;
  readonly dur: number;
  readonly kind: 'jingle' | 'pop' | 'crackle';
  readonly gain?: number;
}

/** A pitch that slides: a party horn, a firework going up. */
interface Slide {
  readonly at: number;
  readonly from: number;
  readonly to: number;
  readonly dur: number;
  readonly voice: Voice;
  readonly gain?: number;
}

type Voice = 'bell' | 'chime' | 'pluck' | 'brass' | 'reed' | 'box' | 'whistle';

interface Tune {
  readonly notes?: readonly Note[];
  readonly noise?: readonly Noise[];
  readonly slides?: readonly Slide[];
}

// Note names to Hz (equal temperament, A4 = 440).
const N = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
  G6: 1567.98,
  C7: 2093,
} as const;

const seq = (voice: Voice, step: number, freqs: readonly number[], dur: number, gain = 1) =>
  freqs.map((freq, i) => ({ at: i * step, freq, dur, voice, gain }));
const chord = (voice: Voice, at: number, freqs: readonly number[], dur: number, gain = 0.7) =>
  freqs.map((freq) => ({ at, freq, dur, voice, gain }));

/** "Tá-dá" in a major chord: the default, and the end of the birthday horn. */
const TA_DA: readonly Note[] = [
  ...seq('pluck', 0.11, [N.C5, N.E5, N.G5], 0.25),
  ...chord('pluck', 0.36, [N.C5, N.E5, N.G5, N.C6], 1.1),
];

/** Each kind of party has its own short sound, always under 3 seconds. */
const TUNES: Record<InviteWordsKey, Tune> = {
  // Wedding bells: a descending peal, then the bells together.
  casamento: {
    notes: [
      ...seq('bell', 0.22, [N.C6, N.B5, N.A5, N.G5], 1.2),
      ...chord('bell', 0.95, [N.C5, N.E5, N.G5, N.C6], 1.8, 0.55),
    ],
  },
  noivado: {
    notes: [
      ...seq('chime', 0.18, [N.E5, N.G5, N.C6, N.E6], 1.4),
      ...chord('chime', 0.8, [N.C6, N.E6], 1.6),
    ],
  },
  'cha-de-panela': {
    noise: [{ at: 0, dur: 0.12, kind: 'jingle', gain: 0.5 }],
    notes: [
      ...seq('chime', 0.2, [N.G5, N.C6, N.E6], 1.2),
      ...chord('chime', 0.7, [N.C6, N.G6], 1.3),
    ],
  },
  // Sleigh bells and a bright bell tune.
  natal: {
    noise: [0, 0.4, 0.8, 1.2, 1.6].map((at) => ({
      at,
      dur: 0.18,
      kind: 'jingle' as const,
      gain: 0.55,
    })),
    notes: [
      ...seq('bell', 0.2, [N.E5, N.E5, N.E5], 0.5, 0.8),
      ...seq('bell', 0.2, [N.E5, N.G5, N.C5, N.D5], 0.5, 0.8).map((n) => ({
        ...n,
        at: n.at + 0.75,
      })),
      { at: 1.6, freq: N.E5, dur: 1.2, voice: 'bell', gain: 0.9 },
    ],
  },
  // A firework going up, the bang, the crackle.
  'ano-novo': {
    slides: [{ at: 0, from: 500, to: 1800, dur: 0.7, voice: 'whistle', gain: 0.35 }],
    noise: [
      { at: 0.72, dur: 0.35, kind: 'pop', gain: 0.9 },
      { at: 0.9, dur: 1.2, kind: 'crackle', gain: 0.5 },
    ],
    notes: chord('chime', 0.8, [N.C6, N.E6, N.G6], 1.4, 0.35),
  },
  // Party horn, then "tá-dá".
  aniversario: {
    slides: [{ at: 0, from: 320, to: 520, dur: 0.35, voice: 'reed', gain: 0.5 }],
    notes: TA_DA.map((n) => ({ ...n, at: n.at + 0.4 })),
  },
  mesversario: {
    notes: [...seq('box', 0.14, [N.C6, N.E6, N.G6, N.E6, N.C7], 0.6)],
  },
  // Playful marimba hops.
  pascoa: {
    notes: [
      ...seq('pluck', 0.12, [N.G5, N.A5, N.B5, N.D6, N.B5, N.G6], 0.3),
      ...chord('pluck', 0.8, [N.G5, N.B5, N.D6], 1),
    ],
  },
  // An accordion run, forró style.
  junina: {
    notes: [
      ...seq('reed', 0.13, [N.G4, N.A4, N.B4, N.C5, N.D5, N.E5], 0.16, 0.6),
      ...chord('reed', 0.85, [N.C5, N.E5, N.G5], 0.8, 0.45),
    ],
  },
  // Glasses touching, then a cheerful run.
  churrasco: {
    notes: [
      { at: 0, freq: 2637, dur: 0.6, voice: 'chime', gain: 0.5 },
      { at: 0.12, freq: 3136, dur: 0.6, voice: 'chime', gain: 0.4 },
      ...seq('pluck', 0.11, [N.C5, N.E5, N.G5, N.C6], 0.5).map((n) => ({ ...n, at: n.at + 0.45 })),
    ],
  },
  'happy-hour': {
    noise: [{ at: 0, dur: 0.25, kind: 'pop', gain: 0.7 }],
    notes: [
      { at: 0.35, freq: 2637, dur: 0.6, voice: 'chime', gain: 0.5 },
      { at: 0.47, freq: 3136, dur: 0.6, voice: 'chime', gain: 0.4 },
      ...chord('pluck', 0.75, [N.F5, N.A5, N.C6], 0.9),
    ],
  },
  confraternizacao: {
    notes: [
      { at: 0, freq: 2637, dur: 0.6, voice: 'chime', gain: 0.5 },
      { at: 0.12, freq: 3136, dur: 0.6, voice: 'chime', gain: 0.4 },
      ...seq('pluck', 0.12, [N.G5, N.C6, N.E6], 0.5).map((n) => ({ ...n, at: n.at + 0.45 })),
      ...chord('pluck', 0.9, [N.C6, N.E6, N.G6], 1),
    ],
  },
  'reuniao-de-familia': {
    notes: [
      ...seq('pluck', 0.16, [N.C5, N.E5, N.G5, N.E5, N.C6], 0.5),
      ...chord('pluck', 0.85, [N.C5, N.G5, N.C6], 1.1),
    ],
  },
  // A short brass fanfare.
  formatura: {
    notes: [
      ...seq('brass', 0.14, [N.G4, N.C5, N.E5], 0.16, 0.7),
      { at: 0.42, freq: N.G5, dur: 0.3, voice: 'brass', gain: 0.7 },
      { at: 0.75, freq: N.E5, dur: 0.15, voice: 'brass', gain: 0.6 },
      ...chord('brass', 0.92, [N.C5, N.E5, N.G5, N.C6], 1.2, 0.45),
    ],
  },
  // A music box lullaby.
  'cha-de-bebe': {
    notes: [
      ...seq('box', 0.2, [N.G5, N.E6, N.D6, N.C6, N.E6], 0.8),
      { at: 1.05, freq: N.C7, dur: 1.2, voice: 'box' },
    ],
  },
  // A soft harp run and a bell.
  batizado: {
    notes: [
      ...seq('pluck', 0.09, [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], 0.9, 0.6),
      { at: 0.65, freq: N.C6, dur: 1.8, voice: 'bell', gain: 0.6 },
    ],
  },
  outros: { notes: TA_DA },
};

/**
 * A short sound to go with the confetti when a guest confirms: wedding bells for a wedding,
 * sleigh bells at Christmas, a fanfare for a graduation… Synthesized with Web Audio, so there
 * are no files to load. Quiet, under 3 seconds, and silent where audio is not available.
 */
@Injectable({ providedIn: 'root' })
export class CelebrationSoundService {
  private context: AudioContext | null = null;

  play(category: string | null | undefined): void {
    const ctx = this.audio();
    if (!ctx) return;
    const tune = TUNES[inviteTheme(category).wordsKey] ?? TUNES.outros;
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    const start = ctx.currentTime + 0.05;
    for (const note of tune.notes ?? []) this.note(ctx, master, start, note);
    for (const slide of tune.slides ?? []) this.slide(ctx, master, start, slide);
    for (const burst of tune.noise ?? []) this.noise(ctx, master, start, burst);
    // Let it all ring out, then free the nodes.
    setTimeout(() => master.disconnect(), 3200);
  }

  private audio(): AudioContext | null {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume();
      return this.context;
    } catch {
      return null;
    }
  }

  private note(ctx: AudioContext, out: AudioNode, start: number, note: Note): void {
    const at = start + note.at;
    const peak = note.gain ?? 1;
    // A voice is a few partials, each with its own decay.
    const partials: readonly (readonly [number, number, OscillatorType])[] =
      note.voice === 'bell'
        ? [
            [1, 1, 'sine'],
            [2.76, 0.35, 'sine'],
            [5.4, 0.15, 'sine'],
          ]
        : note.voice === 'chime'
          ? [
              [1, 1, 'sine'],
              [3, 0.2, 'sine'],
            ]
          : note.voice === 'box'
            ? [
                [1, 1, 'sine'],
                [4, 0.12, 'sine'],
              ]
            : note.voice === 'brass'
              ? [[1, 0.5, 'sawtooth']]
              : note.voice === 'reed'
                ? [[1, 0.4, 'square']]
                : [[1, 0.9, 'triangle']];
    const sustained = note.voice === 'brass' || note.voice === 'reed';
    for (const [ratio, level, type] of partials) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = note.freq * ratio;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak * level, at + (sustained ? 0.03 : 0.005));
      if (sustained) gain.gain.setValueAtTime(peak * level, at + note.dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + note.dur / (ratio > 1 ? ratio * 0.6 : 1));
      let tail: AudioNode = gain;
      if (sustained) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = note.voice === 'brass' ? 2200 : 1800;
        gain.connect(filter);
        tail = filter;
      }
      osc.connect(gain);
      tail.connect(out);
      osc.start(at);
      osc.stop(at + note.dur + 0.05);
    }
  }

  private slide(ctx: AudioContext, out: AudioNode, start: number, slide: Slide): void {
    const at = start + slide.at;
    const osc = ctx.createOscillator();
    osc.type = slide.voice === 'reed' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(slide.from, at);
    osc.frequency.exponentialRampToValueAtTime(slide.to, at + slide.dur);
    const gain = ctx.createGain();
    const peak = slide.gain ?? 0.5;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.04);
    gain.gain.setValueAtTime(peak, at + slide.dur * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + slide.dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2500;
    osc.connect(gain).connect(filter).connect(out);
    osc.start(at);
    osc.stop(at + slide.dur + 0.05);
  }

  private noise(ctx: AudioContext, out: AudioNode, start: number, burst: Noise): void {
    const at = start + burst.at;
    const length = Math.ceil(ctx.sampleRate * burst.dur);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      // Crackle: sparse clicks; the rest: plain white noise.
      data[i] =
        burst.kind === 'crackle'
          ? Math.random() < 0.02
            ? Math.random() * 2 - 1
            : 0
          : Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = burst.kind === 'pop' ? 'lowpass' : 'highpass';
    filter.frequency.value = burst.kind === 'pop' ? 900 : burst.kind === 'jingle' ? 6000 : 2000;
    const gain = ctx.createGain();
    const peak = burst.gain ?? 0.5;
    gain.gain.setValueAtTime(peak, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + burst.dur);
    source.connect(filter).connect(gain).connect(out);
    source.start(at);
  }
}
