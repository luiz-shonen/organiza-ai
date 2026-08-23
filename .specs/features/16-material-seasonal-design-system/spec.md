# Material Seasonal Design System

## Problem Statement

The current catalog presents project-specific primitives as the primary system. It is visually dense and does not demonstrate Angular Material components as a coherent, reusable system. Seasonal changes alter too few tokens to make the component language feel intentional.

## Goals

- [ ] Rebuild `/design-system` as a Material-first living catalog with direct Angular Material examples and a component-anchor sidenav.
- [ ] Provide live light/dark and Brazilian seasonal themes without changing product workflows or authorization.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Rewriting existing feature pages | The request focuses on the component system and showcase. |
| Changing Firebase, Firestore rules, authentication, or route guards | This is visual-system work only. |
| Publishing a component-library package | The existing internal UI foundation remains the application boundary. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Component boundary | Keep the catalog as one standalone container. | The route is a visual reference, not a product workflow. | Yes |
| Páscoa representation | Use resurrection-focused copy with no bunny or egg imagery. | This is explicit in the product request. | Yes |
| Seasonal preview persistence | Change only the current document class. | The selector is a preview control and must not mutate a user preference. | Yes |
| Existing product pages | Do not migrate them in this task. | The request explicitly focuses on components rather than product functionality. | Yes |

**Open questions:** none - all resolved or logged above.

## User Stories

### P1: Material component catalog

**User Story**: As a product designer, I want to inspect the Angular Material component language in one place so that I can make consistent interface decisions.

**Why P1**: The current catalog favors project-specific wrappers over the Material system that the application is built on.

**Acceptance Criteria**:

1. WHEN a super administrator opens `/design-system` THEN the system SHALL render live Angular Material buttons, form fields, selection controls, navigation, cards, lists, progress indicators, dialogs, snackbars, and chips. <!-- event-driven -->
2. WHERE the catalog renders an elevated surface or primary Material action THEN the system SHALL use a translucent glass surface with a gradient ring and an active-season gradient action while preserving Material semantics and focus behavior. <!-- optional-feature -->
3. WHEN the catalog is viewed from 320px through desktop widths THEN the system SHALL keep content within the viewport, preserve a 48px minimum target for navigation and primary controls, and expose accessible labels for interactive controls. <!-- event-driven -->

**Independent Test**: Open the guarded route as a super administrator, inspect every component family, and run responsive Playwright assertions.

### P1: Anchored component navigation

**User Story**: As a developer, I want each component family linked from the sidenav so that I can navigate directly to its live reference.

**Why P1**: A catalog is only useful when each reference is immediately addressable.

**Acceptance Criteria**:

1. WHILE a catalog section is rendered THEN the system SHALL provide a matching sidenav anchor link targeting that section's stable DOM id. <!-- state-driven -->

**Independent Test**: Assert that every section id has a matching `href` in the sidenav.

### P1: Seasonal Material themes

**User Story**: As an organizer, I want the same controls to adopt the active seasonal palette so that seasonal campaigns retain a coherent visual identity.

**Why P1**: Seasonal colors are part of the product identity, not an isolated page decoration.

**Acceptance Criteria**:

1. WHEN an operator selects Páscoa da Ressurreição, Festa Junina, Natal de Jesus, or Ano Novo THEN the system SHALL apply the corresponding root theme class and update shared primary, secondary, tertiary, gradient, glass-border, and canvas tokens. <!-- event-driven -->
2. WHEN an operator changes the light/dark setting or seasonal theme in the catalog THEN the system SHALL update the root document class and selected state without navigation or a page reload. <!-- event-driven -->

**Independent Test**: Switch the controls and assert the document class plus selected control state.

## Edge Cases

- IF a catalogue control wraps at a 320px viewport THEN the system SHALL retain the control inside the document width.
- IF a seasonal preview is replaced by another preview THEN the system SHALL remove the previous root seasonal class.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MSDS-01 | Material component catalog | Implemented | Catalog and unit coverage complete |
| MSDS-02 | Anchored component navigation | Implemented | Sidebar anchor contract complete |
| MSDS-03 | Seasonal Material themes | Implemented | Shared token contract complete |
| MSDS-04 | Material component catalog | Implemented | Glass and gradient Material treatment complete |
| MSDS-05 | Material component catalog | Implemented | Responsive and touch-target E2E coverage complete |
| MSDS-06 | Seasonal Material themes | Implemented | Root class controls complete |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped.

## Success Criteria

- [ ] `/design-system` is a navigable Material-first reference for all listed component families.
- [ ] Each supported seasonal preview changes one shared palette contract without layout drift.
- [ ] Browser checks pass for guards, anchors, no overflow, and 48px controls.
