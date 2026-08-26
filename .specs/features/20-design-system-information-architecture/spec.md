# Design-system information architecture specification

## Problem Statement

The `/design-system` catalog lists usable components, but it presents foundations, product families, and example code as one flat sequence. Maintainers cannot scan the token hierarchy or reliably find the exact Angular API for every component family.

## Goals

- [ ] Organize the live catalog into the clear Brand, Foundations, and Product hierarchy used as inspiration from the Freelaw reference.
- [ ] Make every catalog family discoverable through the shared navigation drawer and an exact Angular usage example.
- [ ] Keep the catalog isolated from product-screen migration and preserve its existing interactive demonstrations.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Migrating production feature screens | The catalog remains the validation surface under AD-038. |
| Changing shared product visual tokens | This change documents and arranges existing APIs only. |
| Building a separate documentation application | `/design-system` remains the living catalog. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- |
| Reference scope | Reuse the Freelaw information architecture, not its visual brand or React API. | Organiza AI retains its own tokens and Angular components. | yes |
| Component documentation granularity | Each documented component family has one collapsible example containing every public component rendered by that family. | It gives maintainers copyable, exact APIs without duplicating the same demo card. | yes |
| Navigation | Reuse `app-navigation-drawer` with grouped anchors. | It preserves the existing shared drawer contract. | yes |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Scan the catalog by design-system layer

**User Story**: As a maintainer, I want Brand, Foundations, and Product groups in the design-system drawer so that I can find tokens and components without scanning an unstructured list.

**Why P1**: Navigation is the entry point to the living catalog.

**Acceptance Criteria**:

1. The design-system drawer SHALL render the groups `Marca`, `Fundações`, and `Produto` in that order. <!-- ubiquitous -->
2. WHEN a maintainer selects a grouped drawer item THEN the system SHALL navigate to its matching `/design-system#<section-id>` anchor. <!-- event-driven -->
3. WHILE the design-system drawer is active THEN the system SHALL render the same shared drawer component and its theme controls. <!-- state-driven -->

**Independent Test**: Open `/design-system`, open the drawer, and verify grouped anchor links and theme controls.

### P1: Inspect tokens as separate foundations

**User Story**: As a maintainer, I want colors, typography, iconography, tokens, and visual fundamentals separated so that I can apply the correct design rule to a new component.

**Why P1**: Tokens and usage rules are the source of consistency across applications.

**Acceptance Criteria**:

1. The catalog SHALL expose stable anchors for `colors`, `typography`, `iconography`, `tokens`, and `foundations`. <!-- ubiquitous -->
2. WHEN a maintainer opens one of those sections THEN the system SHALL show its token purpose and a collapsed copyable code example. <!-- event-driven -->
3. The catalog SHALL identify Material Icons as the canonical icon source and show the three approved type roles. <!-- ubiquitous -->

**Independent Test**: Visit every foundation anchor and assert its heading, source/purpose text, and code disclosure.

### P1: Use a component family without guessing its API

**User Story**: As a feature author, I want each product component family documented with real Angular code so that I can compose a screen using the public `Org*` API rather than local CSS.

**Why P1**: Closed component APIs are the mechanism that prevents design drift.

**Acceptance Criteria**:

1. The catalog SHALL retain a stable anchor for each product family: `components`, `buttons`, `inputs`, `selection`, `navigation`, `stepper`, `data-display`, and `feedback`. <!-- ubiquitous -->
2. WHEN a maintainer opens a product-family section THEN the system SHALL provide a collapsed `Uso recomendado` example that names every `Org*` component rendered in that family. <!-- event-driven -->
3. The data-display family SHALL render and document `org-data-table` alongside metrics, progress, and badges. <!-- ubiquitous -->

**Independent Test**: Inspect each product family for its live component preview and exact code disclosure.

### P2: Keep catalog behaviour and small screens intact

**User Story**: As a reviewer, I want the reorganization to preserve the existing working demos and mobile layout so that clearer documentation does not regress the catalogue.

**Why P2**: The catalog is also the component interaction testbed.

**Acceptance Criteria**:

1. WHEN a seasonal theme is selected THEN the system SHALL keep exactly one seasonal class on the document root. <!-- event-driven -->
2. WHEN a user interacts with tabs, navigation-list items, or feedback controls THEN the system SHALL preserve the existing local demo behaviour. <!-- event-driven -->
3. WHILE the viewport is 320px wide THEN the system SHALL not create horizontal document overflow. <!-- state-driven -->

**Independent Test**: Run the focused unit and Playwright catalog coverage at desktop and 320px.

## Edge Cases

- IF the catalog route has no fragment THEN the drawer SHALL mark `Visão geral` as the active location.
- IF a section contains multiple components THEN its single usage example SHALL include all rendered public component selectors.
- IF the visitor is not a super administrator THEN the existing route guard SHALL continue to deny `/design-system`.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| DSIA-01 | P1: Scan the catalog by design-system layer | Execute | Implementing |
| DSIA-02 | P1: Inspect tokens as separate foundations | Execute | Implementing |
| DSIA-03 | P1: Use a component family without guessing its API | Design | Pending |
| DSIA-04 | P2: Keep catalog behaviour and small screens intact | Design | Pending |

**Coverage:** 4 total, 0 mapped to tasks, 4 unmapped.

## Success Criteria

- [ ] The catalog navigation has three named groups and each item lands on a stable section anchor.
- [ ] Every foundation and product-family section has a copyable Angular example.
- [ ] Focused unit tests, catalog Playwright tests, and the production build pass.
