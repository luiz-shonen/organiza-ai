---
type: decision
title: Testing strategy
status: active
supersedes: [AD-015, AD-029, AD-030]
enforced_by:
  - .github/workflows/ci.yml
related: [workflow.md]
---

# Testing strategy

- **Unit (Vitest, `npm test`)**: every component and service ships a `.spec.ts`. Test the public API: inputs update the template, interactions emit outputs, ARIA attributes are present.
- **Firestore rules (`npm run test:rules`)**: every collection in `firestore.rules` is covered under `e2e/rules/`, including the field checks (`field-validation.rules.test.ts`). Runs in the Firestore emulator, which needs Java 21 or newer on the PATH; CI runs it in the `firestore-rules` job. `events.rules.test.ts` covers who may create, edit, delete and join an event (account holder, owner, invited collaborator, stranger, anonymous).
- **E2E (Playwright, `npm run test:e2e`)**: Desktop Chromium and Pixel 5. Each test is atomic: it builds its own state (mock auth via `addInitScript`, mock Firestore via `__MOCK_DOCUMENTS__`), checks one screen or step, saves a screenshot to `e2e/screenshots/` and ends. Page objects in `e2e/pages/`, harnesses in `e2e/components/`.
- `14-invites-and-guests.spec.ts` covers the redesign's product rules end to end: filter chips, Em breve / Agendado / Realizado by start time, category vs status tags, sign-in redirect, the RSVP drawer, declining with a message, "Quem vai" for guests and organizers, the header theme switch and the profile companion history.
- The Firestore mock (`__MOCK_DOCUMENTS__`) ignores `where` filters: list queries return every document, so a test seeds only what the screen should see.
- Visual checks assert tokens and invariants (no horizontal overflow, 48px targets, focus colour = `--org-primary`), not pixels.

A behaviour change starts with a failing test that describes it; the test is the specification.
