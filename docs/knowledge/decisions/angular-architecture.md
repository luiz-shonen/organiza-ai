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
- Every field people type in is checked by a value object in `src/app/core/value-objects/`:
  - `PersonName` covers the profile, family, guests and companions.
  - The others are `Phone`, `Email`, `EventTitle`, `EventDescription`, `ItemName`, `Quantity`, `Cep`, `AddressNumber` and `PixKey`.
- Each value object has two methods, and the page saves what `create` returns:
  - `validate(raw)` returns the error message, or null. Empty values pass, so `required` handles them.
  - `create(raw)` returns the tidied value, or null.
- How forms use them:
  - Reactive forms pair `valueObjectValidator(Vo.validate)` with `requiredText`, and show messages with `fieldError(control, requiredMessage)`.
  - Signal forms show their errors after the first submit.
- Free text refuses `< > { }` and control characters.
- `org-text-field` takes `[mask]` (for example `Phone.mask`) and `[maxLength]`. A phone is saved as "(11) 98888-1111".
- `firestore.rules` checks the same fields on the server, with looser limits (see [firebase-and-auth.md](firebase-and-auth.md)).

## Four component roles

| Role            | File                              | May inject                                                        | Talks through                                                       |
| --------------- | --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| Page (smart)    | `*.container.ts`                  | domain services, router                                           | —                                                                   |
| Drawer / dialog | `*-drawer.component.ts`           | `FormBuilder` only                                                | `input()` data in, `output()` result out; opened by `DrawerService` |
| Presentational  | `*.component.ts`                  | nothing (FormBuilder for its own form is fine)                    | `input()` / `output()`                                              |
| Design System   | `shared/ui/**/org-*.component.ts` | generic UI behaviour only (Clipboard, Overlay, `FeedbackService`) | inputs, outputs, content slots                                      |

A presentational component never injects a domain service. When it needs a side effect that is purely UI (copy to clipboard and confirm), use the DS primitive that owns it (`org-copy-button`). When it needs a domain side effect, emit an output and let the page handle it.

Reactive forms belong to the page; a step or section component receives its typed `FormGroup` as an input (see `EventBasicInfoForm` in `core/models`).

Example: `features/organizer/event-editor/` — the container owns data, forms and saving; `event-basic-info-step`, `event-address-step`, `event-items-step`, `event-pix-step` and `event-guests-card` are presentational.
