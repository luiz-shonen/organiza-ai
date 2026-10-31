---
type: index
title: Organiza AI — Knowledge Base
updated: 2026-10-31
---

# Organiza AI — Knowledge Base

Open Knowledge Format (OKF): one concept per file, YAML front matter with `type`, plain Markdown links between files. Read this index first, then only the files your task touches.

A rule that has `enforced_by` is checked by a script or a test; the check is the source of truth when the text and the code disagree. A rule without it is guidance.

## Decisions (`type: decision`)

| File                                                      | Covers                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [angular-architecture](decisions/angular-architecture.md) | Standalone + OnPush + signals, component roles (page / dialog / component / DS) |
| [design-system](decisions/design-system.md)               | Closed `Org*` library, Material only inside `shared/ui` and the app shell       |
| [tokens-and-theming](decisions/tokens-and-theming.md)     | Foundation / semantic / theme token layers, dark mode and seasonal themes       |
| [styling-rules](decisions/styling-rules.md)               | BEM, no `!important`, no literal typography or motion, mobile-first             |
| [firebase-and-auth](decisions/firebase-and-auth.md)       | Modular SDK, super admins, ownership and collaborators, verified RSVP           |
| [routes-and-domains](decisions/routes-and-domains.md)     | `/meus-eventos` vs `/admin`, feature folders                                    |
| [testing](decisions/testing.md)                           | Vitest, Firestore rules tests, atomic Playwright E2E                            |
| [workflow](decisions/workflow.md)                         | Test-first changes, quality gate, Conventional Commits, CD                      |

## Gotchas (`type: gotcha`)

| File                                                                          | Covers                                                    |
| ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| [material-mdc-tokens-are-ignored](gotchas/material-mdc-tokens-are-ignored.md) | Angular Material 19+ ignores `--mdc-*`                    |
| [undefined-token-renders-nothing](gotchas/undefined-token-renders-nothing.md) | `var(--missing)` silently drops the whole declaration     |
| [overlays-are-global](gotchas/overlays-are-global.md)                         | Menus, selects and dialogs render outside component hosts |

## Elsewhere

- Component catalog and public APIs: [`DESIGN.md`](../../DESIGN.md) (each `Org*` export must have a "Uso recomendado" entry; checked by `npm run lint:contracts`).
- Commands, routes and project setup: [`README.md`](../../README.md).
- Historical SDD specs (features 01–24) live in git history under the tag `archive/sdd`.
