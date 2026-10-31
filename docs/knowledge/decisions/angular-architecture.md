---
type: decision
title: Angular architecture and component roles
status: active
supersedes: [AD-001, AD-002, AD-003, AD-011]
enforced_by:
  - eslint.config.mjs#prefer-standalone
  - eslint.config.mjs#prefer-on-push-component-change-detection
related: [design-system.md, styling-rules.md]
---

# Angular architecture and component roles

- Standalone components only; `ChangeDetectionStrategy.OnPush` on every component.
- Control flow `@if` / `@for` / `@switch` / `@let`; never structural directives.
- Local state with `signal()`, `computed()`, `input()`, `output()`, `model()`. RxJS only for Firestore streams.
- Always `templateUrl` + `styleUrl`.
- Strict TypeScript, no `any`. Interfaces and form types live in `src/app/core/models/`.

## Four component roles

| Role            | File                              | May inject                                                        | Talks through                                                       |
| --------------- | --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| Page (smart)    | `*.container.ts`                  | domain services, router                                           | —                                                                   |
| Drawer / dialog | `*-drawer.component.ts`           | `FormBuilder` only                                                | `input()` data in, `output()` result out; opened by `DrawerService` |
| Presentational  | `*.component.ts`                  | nothing (FormBuilder for its own form is fine)                    | `input()` / `output()`                                              |
| Design System   | `shared/ui/**/org-*.component.ts` | generic UI behaviour only (Clipboard, Overlay, `FeedbackService`) | inputs, outputs, content slots                                      |

A presentational component never injects a domain service. When it needs a side effect that is purely UI (copy to clipboard and confirm), use the DS primitive that owns it (`org-copy-button`). When it needs a domain side effect, emit an output and let the page handle it.

Reactive forms belong to the page; a step or section component receives its typed `FormGroup` as an input (see `EventBasicInfoForm` in `core/models`).

Example: `features/organizer/event-editor/` — the container owns data, forms and saving; `event-basic-info-step`, `event-address-step`, `event-pix-step`, `event-items-card` and `event-guests-card` are presentational.
