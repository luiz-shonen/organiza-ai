---
type: decision
title: Organiza AI item suggestions
status: active
date: 2026-11-25
updated: 2026-11-25
enforced_by:
  - firestore.rules
  - e2e/rules/ai-suggestions.rules.test.ts
  - ai-worker/test/worker.test.ts
  - ai-worker/test/suggestion.test.ts
  - src/app/core/utils/ai-suggestion.utils.spec.ts
  - src/app/core/services/ai-suggestion.service.spec.ts
  - src/app/shared/components/ai-suggestion-card/ai-suggestion-card.component.spec.ts
related: [push-notifications.md, household-claims.md, firebase-and-auth.md, events-and-invites.md]
---

# Organiza AI item suggestions

Organizers say how many people they expect ("Quantas pessoas você espera?", `expectedGuests`,
optional, 1 to 999). Once 70% of that number confirmed (people, pets aside, approved only when
the event asks for approval), the card "O que pode faltar?" shows to the owner and the
collaborators, on the event page and in the editor's "Itens" step, until the event starts. It
lists what may be missing, each complete (name, quantity, unit, why) with "Adicionar"; an item
already on the list reads "Na lista".

## Cost zero, no Blaze, no queue

- `ai-worker/` is a stateless Cloudflare Worker (free plan): `POST /suggest`. No KV, queue or
  cron. It checks the Firebase ID token itself (RS256 against Google's `securetoken` JWKS, with
  WebCrypto) and asks **Gemini** (each model in `GEMINI_MODELS`), then **Groq** (`GROQ_MODELS`)
  in the same request: any 429, 5xx, timeout or answer that does not parse moves to the next.
  All failing → 503 `busy` → "Nossos assistentes estão ocupados no momento, tente novamente
  mais tarde."
- The answer is checked before use: only the item form's units, whole quantities 1 to 999,
  no markup, nothing already on the list, at most 10 items.

## Limits: 3 per event, 5 per person per hour

- `events/{id}.aiSuggestionsUsed` (+1 per new suggestion, never back) and
  `ai_usage/{uid}` (`count` from `windowStart`; a new hour starts at 1). `firestore.rules`
  enforces both with `request.time`.
- **The Worker writes them, with the organizer's own token** (Firestore REST `commit`), in one
  atomic commit with the cache entry, and only after a good answer. Why not the app: a client
  that counts after success could call the Worker and never count, spending the providers' free
  quota. The rules still decide (they see the organizer's token), so nothing bypasses them.
  The commit's `currentDocument` preconditions make two taps at once count once: the other fails.
- The Worker also refuses early (403 not an organizer, 429 `event-limit` / `hour-limit`) before
  asking any provider. A failure is never counted.
- The card always says what is left ("Restam 2 de 3 sugestões para este evento.").

## Cache (`ai_cache/{key}`)

- Key: category, people rounded up to 5 and the list's names (`churrasco_20p_d99ebc22`);
  `suggestionKey` exists twice (`ai-worker/src/suggestion.ts`, `core/utils/ai-suggestion.utils.ts`)
  and both test files pin the same cases.
- The app reads the cache first: a hit shows at once, costs nothing and is kept on the event
  (`aiSuggestionKey`, any organizer may point it at an existing cache entry). The Worker writes
  new entries; an entry is created only in the commit that spends a suggestion, never changed.
- Shared between accounts, so the app checks entries again on read (`toAiSuggestion`) and
  Angular escapes the text.

## In the app

- `AiSuggestionService` (root, signals) runs in the background: the button returns at once,
  the card shows a quiet "Pensando nas sugestões…", and the app shell toasts when it ends,
  wherever the person is.
- `runtime-config.js` → `ai.url`, written by the CD step "Deploy AI Relay". Without it the card
  never shows.

## Deploy and secrets

- GitHub secrets: `GEMINI_API_KEY` (the app's own AI Studio project) and `GROQ_API_KEY`;
  `CLOUDFLARE_WORKER_TOKEN` is the push relay's. One provider key is enough; with none the step
  skips. The PR reviews use another project's key, `GEMINI_PR_REVIEWS_API_KEY`, so the app and
  the reviews never share a quota.
- Models: the `-latest` aliases (`gemini-flash-lite-latest`, then `gemini-flash-latest`), so a
  retired version needs no change; Groq's are named. Both lists live in `ai-worker/wrangler.toml`.
- One free account per provider: never several accounts or keys to add up free quotas (against
  the providers' terms).
