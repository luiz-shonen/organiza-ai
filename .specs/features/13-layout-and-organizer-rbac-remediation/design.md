# Feature 13 Design — Layout Remediation and Organizer RBAC Regression Coverage

**Spec**: `.specs/features/13-layout-and-organizer-rbac-remediation/spec.md`  
**Status**: Approved by the explicit task request

---

## Architecture Overview

The remediation keeps visual ownership local: the collaborator dialog owns its own responsive insets, ProfileInfoCard owns the editable-name layout, EventCard owns its internal content rhythm, and the application shell owns scroll containment. A focused Playwright contract measures the user-visible bounds and resets the actual scroll owner before every baseline capture.

```mermaid
flowchart LR
  A[Mobile interaction] --> B[main.app-content]
  B --> C[BasePage.captureScreenshot]
  C --> D[window and app-content at origin]
  D --> E[Playwright visual assertions]
  F[Collaborator dialog] --> E
  G[Profile edit form] --> E
  H[Event editor and detail] --> E
  I[Non-superadmin organizer] --> J[/meus-eventos E2E flow]
  J --> K[authGuard / superAdminGuard route contract]
```

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --- | --- | --- |
| `BasePage` | `e2e/pages/base.page.ts` | Extend the existing central screenshot helper rather than duplicating scroll recovery in individual tests. |
| Design-token helpers | `e2e/helpers/design-tokens.helper.ts` | Add a focused bounding-box/inset assertion beside the existing overflow, font, glass, and touch-target checks. |
| Collaborator dialog | `src/app/features/organizer/event-editor/components/collaborator-invite-dialog/` | Preserve its signal input/output API and only repair its responsive surface layout. |
| ProfileInfoCard | `src/app/features/profile/components/profile-info-card/` | Preserve update/cancel behavior while giving the edit form a full available row and signal-native input binding. |
| Event Editor | `src/app/features/admin/event-editor/` | Preserve stepper behavior; constrain the shell scroll surface and verify the active step. |
| EventCard | `src/app/features/event-detail/components/event-card/` | Keep one outer mobile gutter owned by EventDetail and internal card padding owned by EventCard. |
| Auth mocks | `e2e/helpers/auth-mock.helper.ts` | Use a non-whitelisted user email to prove organizer paths never depend on Super Admin access. |

### Integration Points

| System | Integration method |
| --- | --- |
| Angular Material 3 | Use the existing outlined field and official `--mdc-*` / `--mat-sys-*` tokens only. |
| App scroll shell | Select `main.app-content` in the central screenshot helper; do not reset or hide intentional internal stepper scrolling. |
| Angular router guards | Assert the existing `/meus-eventos` auth guard and `/admin` Super Admin redirect through unit and browser tests. |
| Firestore authorization | Not changed by this feature. The audit found a separate critical rules defect; it requires a dedicated rules/emulator work item. |

## Components

### Scroll-capture contract

- **Purpose**: Ensure screenshot output begins from the same page origin that users see.
- **Locations**: `src/app/app.scss`, `e2e/pages/base.page.ts`, `e2e/helpers/design-tokens.helper.ts`, relevant E2E specs.
- **Interfaces**:
  - `BasePage.captureScreenshot(name: string): Promise<void>` resets window and `main.app-content` scroll positions before capture.
  - `assertViewportInset(locator: Locator, inset: number): Promise<void>` proves visible mobile bounds without relying on screenshot inspection alone.
- **Dependencies**: Playwright `Page` and existing page objects.
- **Reuses**: Existing visual helper style and screenshot paths.

### CollaboratorInviteDialogComponent

- **Purpose**: Render a readable, touch-safe invite dialog with predictable responsive insets.
- **Location**: `src/app/features/organizer/event-editor/components/collaborator-invite-dialog/`.
- **Interfaces**: Existing `invite`, `removeCollaborator`, and `closeDialog` contracts are unchanged.
- **Dependencies**: Existing Material dialog primitives and `--mat-sys-*` colors.
- **Reuses**: Global glass dialog surface; component-level styles add only explicit title/content/actions spacing.

### ProfileInfoCardComponent

- **Purpose**: Render profile editing as a full-width form area rather than a narrow flex-column detail.
- **Location**: `src/app/features/profile/components/profile-info-card/`.
- **Interfaces**: Existing `updateName` output, `startEditing`, `saveName`, and `cancelEditing` are unchanged.
- **Dependencies**: Existing outlined Material field tokens.
- **Reuses**: Existing signal state; replace template `ngModel` synchronization with `[value]` and `(input)`.

### EventCard mobile composition

- **Purpose**: Preserve a single outer mobile gutter and prevent long event details from consuming it twice.
- **Location**: `src/app/features/event-detail/components/event-card/`.
- **Interfaces**: No TypeScript interface change.
- **Dependencies**: EventDetail outer container and existing Material/brand color tokens.
- **Reuses**: Current card internal padding, title wrapping, and 48px date/location targets.

## Data Models

No data-model change is required.

## Error Handling Strategy

| Scenario | Handling | User impact |
| --- | --- | --- |
| Dialog content exceeds the small viewport height | Keep the Material dialog internally scrollable while retaining its 16px inset. | Controls remain reachable without horizontal clipping. |
| Interaction scrolls the app shell horizontally | Screenshot helper resets the actual scroll owner before image capture. | Baselines are deterministic and representative. |
| Non-Super-Admin opens `/admin` | Existing `superAdminGuard` redirects to `/meus-eventos`; E2E locks this behavior. | No exposure to admin navigation or organizer-flow dependency on elevated access. |

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Document-level overflow checks miss the actual app scroll owner | `src/app/app.scss:151-155`, `e2e/pages/base.page.ts:33-42` | A screenshot can be shifted while `scrollWidth` is green. | Reset and assert `main.app-content` scroll origin plus visual element bounds. |
| Global styles use legacy `!important` overrides | `src/styles.scss:647-850` | Broad token changes could cause unrelated regressions. | Do not refactor global fields; apply focused component ownership only. |
| `/admin` and `/meus-eventos` share organizer routes | `src/app/app.routes.ts:26-35` | The domain architecture is misleading although route guards work. | Correct organizer test journeys and retain a documented follow-up for a dedicated Super Admin metrics route. |
| Firestore rules permit unauthorized privilege elevation and do not enforce owner/collaborator access | `firestore.rules:15,23-70` | This is a critical authorization defect outside the visual request. | Report it separately; do not misrepresent route guard tests as server authorization. |

## Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Visual regression oracle | Assert numerical mobile insets, scroll origin, focus token, touch size, and overflow in E2E in addition to screenshots. | A screenshot alone is too weak to stop recurrence. |
| Scroll ownership | Recover the app shell scroll position centrally in `BasePage`. | It is the current scroll owner and avoids per-test recovery drift. |
| Form correction | Use component-owned layout and signals, not new global form overrides. | Preserves the shared MDC system and avoids extending legacy `!important` debt. |
| Admin-domain handling | Do not fabricate a Super Admin metrics screen in this feature. | It needs a product UX decision; route guards are tested and the missing domain split is reported. |
