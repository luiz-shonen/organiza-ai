---
type: index
title: Organiza AI — Knowledge Base
updated: 2026-11-25
---

# Organiza AI — Knowledge Base

Open Knowledge Format (OKF): one concept per file, YAML front matter with `type`, plain Markdown links between files. Read this index first, then only the files your task touches.

A rule that has `enforced_by` is checked by a script or a test; the check is the source of truth when the text and the code disagree. A rule without it is guidance.

## Decisions (`type: decision`)

| File                                                      | Covers                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [angular-architecture](decisions/angular-architecture.md) | Standalone + OnPush + signals, component roles (page / dialog / component / DS)            |
| [design-system](decisions/design-system.md)               | Closed `Org*` library, Material only inside `shared/ui` and the app shell                  |
| [tokens-and-theming](decisions/tokens-and-theming.md)     | Foundation / semantic / theme token layers, dark mode and seasonal themes                  |
| [styling-rules](decisions/styling-rules.md)               | BEM, no `!important`, no literal typography or motion, mobile-first                        |
| [firebase-and-auth](decisions/firebase-and-auth.md)       | Modular SDK, accounts only, owner and collaborator rules, runtime key, stored invite data  |
| [events-and-invites](decisions/events-and-invites.md)     | Invite states, event states, filters, tags, RSVP drawer, Confirmados, names from profile   |
| [secret-santa](decisions/secret-santa.md)                 | Amigo oculto: whose entry, invite sign-ups, duplicates, draw day, secret link screens      |
| [push-notifications](decisions/push-notifications.md)     | Notices between people: who is told what, bell history, push relay Worker, secrets, iPhone |
| [household-claims](decisions/household-claims.md)         | What each family brings: claims per household, units, fixed quantity, bought               |
| [routes-and-domains](decisions/routes-and-domains.md)     | `/meus-eventos` vs `/admin`, feature folders                                               |
| [testing](decisions/testing.md)                           | Vitest, Firestore rules tests, atomic Playwright E2E                                       |
| [workflow](decisions/workflow.md)                         | Test-first changes, quality gate, Conventional Commits, CD                                 |

## Gotchas (`type: gotcha`)

| File                                                                                      | Covers                                                                                        |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [material-mdc-tokens-are-ignored](gotchas/material-mdc-tokens-are-ignored.md)             | Angular Material 19+ ignores `--mdc-*`                                                        |
| [undefined-token-renders-nothing](gotchas/undefined-token-renders-nothing.md)             | `var(--missing)` silently drops the whole declaration                                         |
| [overlays-are-global](gotchas/overlays-are-global.md)                                     | Menus, selects and dialogs render outside component hosts                                     |
| [nested-form-submits-outer](gotchas/nested-form-submits-outer.md)                         | A `<form>` inside a reactive form submits the outer one                                       |
| [missing-static-file-returns-index](gotchas/missing-static-file-returns-index.md)         | A missing `runtime-config.js` is served as `index.html` and Firebase gets the placeholder key |
| [index-deploy-needs-index-admin](gotchas/index-deploy-needs-index-admin.md)               | The CD deploy fails with 403 on indexes unless its service account has Index Admin            |
| [conditional-projection-needs-one-root](gotchas/conditional-projection-needs-one-root.md) | An `@if` projects into a named slot only with one root element                                |
| [infinite-animations-never-finish](gotchas/infinite-animations-never-finish.md)           | Waiting for `getAnimations()` hangs on a looping animation                                    |
| [fluid-type-needs-a-custom-property](gotchas/fluid-type-needs-a-custom-property.md)       | `clamp()` font sizes fail `lint:contracts` unless put in a custom property                    |

## Elsewhere

- Component catalog and public APIs: [`DESIGN.md`](../../DESIGN.md) (each `Org*` export must have a "Uso recomendado" entry; checked by `npm run lint:contracts`).
- Commands, routes and project setup: [`README.md`](../../README.md).
- Historical SDD specs (features 01–24) live in git history under the tag `archive/sdd`.
