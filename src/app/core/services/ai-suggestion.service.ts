import { Injectable, inject, signal } from '@angular/core';
import { aiRelayUrl } from '../../../environments/firebase-config';
import {
  AI_SUGGESTIONS_PER_EVENT,
  AI_SUGGESTIONS_PER_HOUR,
  type AiSuggestion,
  type AiSuggestionInput,
  type AiSuggestionState,
} from '../models';
import { suggestionKey, toAiSuggestion } from '../utils/ai-suggestion.utils';
import { AuthService } from './auth.service';
import { FirestoreGateway } from './firestore.gateway';

const IDLE: AiSuggestionState = { status: 'idle', suggestion: null, message: '' };

export const AI_BUSY_MESSAGE =
  'Nossos assistentes estão ocupados no momento, tente novamente mais tarde.';

/** A finished request, for the app shell's toast while the person is on another screen. */
export interface AiSuggestionDone {
  readonly eventId: string;
  readonly ok: boolean;
  readonly message: string;
}

function hourLimitMessage(retryAt: unknown): string {
  const at = typeof retryAt === 'string' ? new Date(retryAt) : null;
  const time =
    at && !isNaN(at.getTime())
      ? at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : null;
  return `Você já pediu ${AI_SUGGESTIONS_PER_HOUR} sugestões nesta hora. ${
    time ? `Tente de novo às ${time}.` : 'Tente de novo mais tarde.'
  }`;
}

/** What the relay's error means for the person. Nothing was counted in any of them. */
function errorMessage(status: number, body: Record<string, unknown>): string {
  if (body['error'] === 'event-limit') {
    return `Este evento já usou as ${AI_SUGGESTIONS_PER_EVENT} sugestões do Organiza AI.`;
  }
  if (body['error'] === 'hour-limit') return hourLimitMessage(body['retryAt']);
  if (body['error'] === 'limit') return 'Limite de sugestões atingido. Tente de novo mais tarde.';
  if (body['error'] === 'retry') return 'Não deu certo desta vez. Tente de novo.';
  if (status === 401 || status === 403) return 'Só quem organiza o evento pede sugestões.';
  return AI_BUSY_MESSAGE;
}

/**
 * Organiza AI item suggestions, run in the background: "Sugerir itens" returns at once and the
 * state of each event lives here (root), so the person keeps using the app and finds the
 * answer when they come back. The flow: the shared cache (`ai_cache`) first, free; otherwise
 * the relay (`ai-worker/`), which asks Gemini, then Groq, and saves the answer, the event's
 * count and the person's hour count in one commit made with their own token. A failure is
 * never counted.
 */
@Injectable({ providedIn: 'root' })
export class AiSuggestionService {
  private readonly gateway = inject(FirestoreGateway);
  private readonly auth = inject(AuthService);

  private readonly states = signal<Readonly<Record<string, AiSuggestionState>>>({});
  /** The last request that finished; the app shell turns it into a toast. */
  readonly lastDone = signal<AiSuggestionDone | null>(null);

  /** False while the relay is not deployed: the assistant does not show at all. */
  isAvailable(): boolean {
    return !!aiRelayUrl();
  }

  /** The event's suggestion right now (reactive: read it inside a `computed`). */
  stateFor(eventId: string): AiSuggestionState {
    return this.states()[eventId] ?? IDLE;
  }

  /**
   * Shows the suggestion saved on the event (`aiSuggestionKey`) after a reload, unless one is
   * already on screen or running.
   */
  async restore(eventId: string, key: string | null | undefined): Promise<void> {
    if (!key || this.stateFor(eventId).status !== 'idle') return;
    try {
      const suggestion = toAiSuggestion(await this.gateway.getDoc(`ai_cache/${key}`));
      if (suggestion && this.stateFor(eventId).status === 'idle') {
        this.set(eventId, { status: 'ready', suggestion, message: '' });
      }
    } catch {
      // Not shown is fine: the button asks again.
    }
  }

  /** "Sugerir itens": starts in the background and returns at once. */
  generate(eventId: string, input: AiSuggestionInput): void {
    if (this.stateFor(eventId).status === 'loading') return;
    const previous = this.stateFor(eventId).suggestion;
    this.set(eventId, { status: 'loading', suggestion: previous, message: '' });
    void this.run(eventId, input).then(
      (suggestion) => {
        this.set(eventId, { status: 'ready', suggestion, message: '' });
        this.lastDone.set({ eventId, ok: true, message: 'As sugestões do Organiza AI chegaram.' });
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : AI_BUSY_MESSAGE;
        this.set(eventId, { status: 'error', suggestion: previous, message });
        this.lastDone.set({ eventId, ok: false, message });
      },
    );
  }

  private async run(eventId: string, input: AiSuggestionInput): Promise<AiSuggestion> {
    const key = suggestionKey(input);
    const cached = toAiSuggestion(await this.gateway.getDoc(`ai_cache/${key}`).catch(() => null));
    if (cached) {
      // Kept on the event so it shows again after a reload; costs nothing if it fails.
      this.gateway.updateDoc(`events/${eventId}`, { aiSuggestionKey: key }).catch(() => undefined);
      return cached;
    }

    const user = this.auth.currentUser();
    const url = aiRelayUrl();
    if (!user || !url) throw new Error(AI_BUSY_MESSAGE);
    let response: Response;
    try {
      response = await fetch(`${url}/suggest`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ eventId, input }),
      });
    } catch {
      throw new Error(AI_BUSY_MESSAGE);
    }
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const suggestion = response.ok ? toAiSuggestion(body['suggestion']) : null;
    if (!suggestion) throw new Error(errorMessage(response.status, body));
    return suggestion;
  }

  private set(eventId: string, state: AiSuggestionState): void {
    this.states.update((states) => ({ ...states, [eventId]: state }));
  }
}
