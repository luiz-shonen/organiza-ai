# Organiza AI — Agent Guidelines

Angular 22 + Angular Material 22 + Firebase app for organising events (pt-BR UI). This file is the entry point for every agent (`CLAUDE.md` and `GEMINI.md` point here). Keep it short: details live in the files below.

## Read before working

1. [`docs/knowledge/index.md`](docs/knowledge/index.md) — decisions and gotchas, one concept per file (Open Knowledge Format). Read only the ones your task touches.
2. [`DESIGN.md`](DESIGN.md) — `Org*` component catalog and public APIs.
3. [`README.md`](README.md) — setup, commands, routes.

## Non-negotiables

- Standalone, `OnPush`, signals, `@if`/`@for`, `templateUrl` + `styleUrl`, no `any`.
- Pages (`*.container.ts`) own data and side effects; presentational components use only `input()`/`output()`.
- Features use only `Org*` components from `src/app/shared/ui`. No `@angular/material` import, `<mat-*>` tag or `.mat-*` selector outside `shared/ui` and `src/app/app.*`. Missing primitive? Add it to the DS first and document it in `DESIGN.md`.
- Styling only through `--org-*` tokens (`shared/ui/tokens/`): no `!important`, no hex, no literal font sizes/weights/line heights/letter spacing/transition durations, no `.dark` selectors, no `--mdc-*`.
- Mobile first, zero horizontal overflow, touch targets ≥ 48px, WCAG 2.1 AA. Every change must work on desktop (pages take 70% of the width from 1200px) and on a phone.
- Super admins and open-registration rules: see `docs/knowledge/decisions/firebase-and-auth.md`.
- How events, invites, filters, tags and "Confirmados" behave: see `docs/knowledge/decisions/events-and-invites.md`; the amigo oculto: `docs/knowledge/decisions/secret-santa.md`.
- A person with an account is always shown by their **profile name** (`publicProfiles/{uid}`, or `AuthService.displayName` for the signed-in person), never a stored copy or the Google name.
- Screens that hold one main thing (the secret link pages) fill the height under the top bar and never scroll on short laptop windows; check at 500–720px high and on a phone.

## Before you finish

```bash
npm run quality   # ESLint (src, scripts, e2e), Stylelint, UI contracts, script tests, Prettier
npm test
npm run build
```

Open pull requests with `npm run pr:create` (uses the personal `GH_TOKEN` from `.env.local`). CI runs a Gemini review after `quality` and `e2e` pass; see `docs/knowledge/decisions/workflow.md`.

Behaviour changes ship with a test. If you learned something non-obvious, add or update one file in `docs/knowledge/`; if a script can check it, add the check and reference it in `enforced_by`.
