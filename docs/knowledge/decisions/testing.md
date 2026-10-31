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
- **Firestore rules (`npm run test:rules`)**: every collection in `firestore.rules` is covered under `e2e/rules/`.
- **E2E (Playwright, `npm run test:e2e`)**: Desktop Chromium and Pixel 5. Each test is atomic: it builds its own state (mock auth via `addInitScript`, mock Firestore via `__MOCK_DOCUMENTS__`), checks one screen or step, saves a screenshot to `e2e/screenshots/` and ends. Page objects in `e2e/pages/`, harnesses in `e2e/components/`.
- Visual checks assert tokens and invariants (no horizontal overflow, 48px targets, focus colour = `--org-primary`), not pixels.

A behaviour change starts with a failing test that describes it; the test is the specification.
