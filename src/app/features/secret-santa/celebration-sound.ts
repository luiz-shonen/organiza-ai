/** The name of the amigo oculto lands on the paper about this long after it starts to open. */
export const CELEBRATION_SOUND_DELAY_MS = 1400;

type AudioContextClass = typeof AudioContext;

/**
 * A short "ta-da", made on the spot (no file to download): a rising arpeggio, a bright chord and
 * a sprinkle of high bells on top. Silent where the browser has no Web Audio or does not let the
 * page play sound yet.
 */
export function playCelebrationSound(delayMs = 0): void {
  const Context: AudioContextClass | undefined =
    globalThis.AudioContext ??
    (globalThis as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext;
  if (!Context) return;
  let context: AudioContext;
  try {
    context = new Context();
  } catch {
    return;
  }
  context.resume?.().catch(() => undefined);

  const start = context.currentTime + delayMs / 1000 + 0.05;
  const volume = context.createGain();
  volume.gain.value = 0.16;
  volume.connect(context.destination);

  const note = (
    frequency: number,
    at: number,
    duration: number,
    shape: OscillatorType,
    loudness: number,
  ) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = shape;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(loudness, at + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope).connect(volume);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.05);
  };

  // C5, E5, G5 going up, then the C major chord rings, then bells sparkle above it.
  [523.25, 659.25, 783.99].forEach((f, i) => note(f, start + i * 0.09, 0.28, 'triangle', 1));
  [523.25, 659.25, 783.99, 1046.5].forEach((f) => note(f, start + 0.3, 1.6, 'triangle', 0.55));
  [2093, 2637, 3136, 2637, 3520, 4186].forEach((f, i) =>
    note(f, start + 0.34 + i * 0.075, 0.4, 'sine', 0.22),
  );

  setTimeout(() => void context.close().catch(() => undefined), delayMs + 3000);
}
