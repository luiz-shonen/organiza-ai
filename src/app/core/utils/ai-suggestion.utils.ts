import {
  AI_SUGGESTION_THRESHOLD,
  type AiSuggestedItem,
  type AiSuggestion,
  type AiSuggestionInput,
} from '../models/ai-suggestion.model';

/** "Pão de Alho!" → "pao-de-alho". Same as `normalize` in ai-worker/src/suggestion.ts. */
export function normalizeForAi(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * The `ai_cache` document id, `churrasco_20p_d99ebc22`: category, people rounded up to 5 and
 * the list's names. Must match `suggestionKey` in ai-worker/src/suggestion.ts, which writes it.
 */
export function suggestionKey(input: AiSuggestionInput): string {
  const category = normalizeForAi(input.category).slice(0, 40) || 'evento';
  const people = Math.min(999, Math.max(5, Math.ceil(input.people / 5) * 5));
  const names = [...new Set(input.items.map(normalizeForAi).filter(Boolean))].sort();
  return `${category}_${people}p_${names.length ? fnv1a(names.join('|')) : 'vazio'}`;
}

/** How many confirmed people bring the assistant up: 70% of the expected, rounded up. */
export function aiSuggestionThreshold(expectedGuests: number): number {
  return Math.ceil(expectedGuests * AI_SUGGESTION_THRESHOLD);
}

/** The assistant shows once enough of the expected people confirmed. */
export function isAiSuggestionDue(
  expectedGuests: number | null | undefined,
  confirmedPeople: number,
): boolean {
  return !!expectedGuests && confirmedPeople >= aiSuggestionThreshold(expectedGuests);
}

/** Compares a suggestion with the items already on the list: case, accents and spaces aside. */
export function suggestedItemKey(item: Pick<AiSuggestedItem, 'name'>): string {
  return normalizeForAi(item.name);
}

/** A cached or fresh answer, checked again on read: the cache is shared between accounts. */
export function toAiSuggestion(data: unknown): AiSuggestion | null {
  if (!data || typeof data !== 'object') return null;
  const { items, tip } = data as { items?: unknown; tip?: unknown };
  if (!Array.isArray(items)) return null;
  const clean = items
    .filter(
      (item): item is AiSuggestedItem =>
        !!item &&
        typeof item.name === 'string' &&
        !!item.name.trim() &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        typeof item.unit === 'string',
    )
    .slice(0, 10)
    .map((item) => ({
      name: item.name.slice(0, 60),
      quantity: Math.min(999, item.quantity),
      unit: item.unit.slice(0, 20),
      reason: typeof item.reason === 'string' ? item.reason.slice(0, 120) : '',
    }));
  return { items: clean, tip: typeof tip === 'string' ? tip.slice(0, 200) : '' };
}
