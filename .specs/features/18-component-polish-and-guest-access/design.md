# Feature 18 — Component polish and guest access design

**Spec**: `.specs/features/18-component-polish-and-guest-access/spec.md`  
**Status**: Approved by explicit correction request

## Architecture Overview

The route guard treats an anonymous Firebase identity as a public-RSVP session,
not an organizer credential. Visual repairs are made at the owning `Org*`
component, then its showcase and product consumers are simplified to compose that
single owner.

```mermaid
graph TD
  A[Anonymous RSVP session] --> B[authGuard]
  B -->|anonymous or null| C[/login]
  B -->|identified user| D[Organizer route]
  E[Shared Org component] --> F[Design-system example]
  E --> G[Home/dashboard/editor consumer]
  H[Theme tokens] --> E
```

## Code Reuse Analysis

| Existing component | Location | Change / reuse |
| --- | --- | --- |
| `authGuard` | `src/app/core/guards/` | Extend its authenticated predicate to reject `isAnonymous`. |
| `OrgSurfaceComponent` | `src/app/shared/ui/surface/` | Own single-ring atmosphere/radius/border behavior; remove nested consumer composition. |
| Actions and `OrgChipComponent` | `src/app/shared/ui/actions/` | Add explicit static/selectable and readable gradient contracts. |
| Field components | `src/app/shared/ui/forms/` | Own suffix spacing, Material geometry, option contrast, and optional textarea counter. |
| Navigation/data components | `src/app/shared/ui/navigation/`, `data-display/` | Make demo state real and remove unintended link navigation/nested metric surface. |
| `OrgBannerComponent` | `src/app/shared/ui/feedback/` | Use as the editor collaborator alert instead of a surface pretending to be an alert. |

## Components and interfaces

| Component family | Interface direction | Consumer impact |
| --- | --- | --- |
| Auth guard | `isAuthenticatedUser(user): boolean` internal predicate | Anonymous direct navigation redirects to login. |
| Chip | `selectable: input(false)` | Static badges are `mat-chip`; categories explicitly opt in. |
| Actions | Existing `gradient` controls foreground and border composition | No `border-image` square rings; icon foreground follows variant. |
| Textarea | `minLength`, `maxLength`, optional counter display | Existing fields remain valid with no counter by default. |
| Tabs/list/menu/stepper | Typed item content/action/route semantics and selected state | Showcase interactions update visible content; action list does not navigate. |
| Metric/surface/banner | One wrapper surface per block | Product cards remove inner visual boundary. |

## Error Handling Strategy

| Scenario | Handling | User impact |
| --- | --- | --- |
| Anonymous organizer navigation | Router returns login `UrlTree`. | Visitor is asked to sign in instead of seeing organizer content. |
| Invalid time input | Preserve last valid normalized value. | No malformed time enters the form model. |
| Empty navigation action target | Render a button/action, not a malformed link. | Demo remains interactive without route side effects. |

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Anonymous Firebase auth is required by public RSVP | `event-detail.container.ts` | Removing it would regress RSVP state. | Reject it only in organizer/super-admin guards and test both cases. |
| `OrgSurfaceComponent` is a wrapper | `shared/ui/surface/` | Nesting with Material cards makes duplicated borders likely. | Each corrected consumer owns exactly one semantic surface wrapper. |
| Showcase examples previously served as static mockups | `design-system-showcase.container.*` | Documentation can claim behavior that does not run. | Give reviewed controls explicit signal-backed state and tests. |
| Overlay styles cross Material's overlay boundary | `org-menu.component.*` | Encapsulation can miss menu panel surface rules. | Use component-owned documented `panelClass`/MDC tokens and assert the overlay. |

## Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Route authentication definition | `user !== null && !user.isAnonymous` | Matches the visible product auth state and AD-024 identity boundary. |
| Surface correction | Refactor consumers, not global CSS overrides | AD-039 reserves reusable appearance ownership to `Org*` components. |
| Documentation code | Source-controlled exact string beside each demo state | Makes the showcase a reliable AI/developer reference. |

No project-level architecture decision is added: this design conforms to AD-024,
AD-028, AD-031, AD-038, and AD-039.
