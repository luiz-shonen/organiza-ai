/**
 * Organiza AI item suggestions (docs/knowledge/decisions/ai-suggestions.md). The limits are
 * the ones `firestore.rules` and `ai-worker/` enforce; here they only shape the screens.
 */

/** Suggestions an event may use. */
export const AI_SUGGESTIONS_PER_EVENT = 3;
/** Suggestions one person may ask for in an hour. */
export const AI_SUGGESTIONS_PER_HOUR = 5;
/** Share of the expected people that must have confirmed before the assistant shows up. */
export const AI_SUGGESTION_THRESHOLD = 0.7;

/** What the assistant is asked: the event's category, people to plan for, names on the list. */
export interface AiSuggestionInput {
  readonly category: string;
  readonly people: number;
  readonly items: readonly string[];
}

/** One missing item, ready to add: "Carvão · 3 sacos". */
export interface AiSuggestedItem {
  readonly name: string;
  readonly quantity: number;
  readonly unit: string;
  /** Why it is missing, in a few words. */
  readonly reason: string;
}

export interface AiSuggestion {
  readonly items: readonly AiSuggestedItem[];
  readonly tip: string;
}

/**
 * One event's suggestion while the person moves around the app: `loading` runs in the
 * background, `ready` holds the answer, `error` a message to show.
 */
export interface AiSuggestionState {
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly suggestion: AiSuggestion | null;
  readonly message: string;
}
