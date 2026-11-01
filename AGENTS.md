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
- Mobile first, zero horizontal overflow, touch targets ≥ 48px, WCAG 2.1 AA.
- Super admins and open-registration rules: see `docs/knowledge/decisions/firebase-and-auth.md`.

## Before you finish

```bash
npm run quality   # ESLint (src, scripts, e2e), Stylelint, UI contracts, script tests, Prettier
npm test
npm run build
```

Open pull requests with `npm run pr:create` (uses the personal `GH_TOKEN` from `.env.local`). CI runs a Gemini review after `quality` and `e2e` pass; see `docs/knowledge/decisions/workflow.md`.

Behaviour changes ship with a test. If you learned something non-obvious, add or update one file in `docs/knowledge/`; if a script can check it, add the check and reference it in `enforced_by`.
