# Feature 17 — Component-First Library Expansion

## Problem Statement

The design-system showcase demonstrates several Angular Material controls, but most are still authored directly with Material markup and local showcase SCSS. The product application also consumes legacy styling directives and duplicates visual treatment in feature styles. That makes a visual correction difficult to propagate and lets a new feature bypass the intended design contract.

This feature turns the priority component families identified in the comparison with the Freelaw catalog into closed `Org*` Angular components, then refactors every current application consumer of those families to use them. The showcase becomes their living documentation and the component library becomes the only visual-contract owner.

## Goals

- [ ] Provide closed, documented `Org*` components for actions, fields, selection, navigation, data display, and feedback overlays.
- [ ] Expose a small, typed API for optional gradient and atmosphere treatments so another SaaS can disable the festive treatment without CSS forks.
- [ ] Make every new public component demonstrable and copyable from `/design-system` in light, dark, and seasonal themes.
- [ ] Protect the public contracts with unit tests and focused showcase contracts.
- [ ] Refactor all existing consumers of the priority families to use the new components, removing the equivalent legacy directive imports and feature-owned visual rules.
- [ ] Enforce one visual source of truth: component SCSS and shared semantic tokens own component appearance; product feature SCSS owns layout and domain content only.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Rebuilding unrelated product workflows | The refactor changes component composition and visual ownership, not business behavior, routes, or data flow. |
| Removing legacy directives before all consumers migrate | Compatibility code remains only until the final migration task proves there are no application consumers. |
| Remote package publishing | `shared/ui` remains application-owned until a second app validates the API. |
| Backend, Firebase, or authorization changes | The library is presentational and does not own product data. |
| Rebuilding all Angular Material components | The scope is the priority families below, not a one-to-one clone of every Material control. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Delivery boundary | Build the priority family below in phases, with no product-page migration. | It makes the contracts reviewable before application-wide adoption. | y |
| Styling switch | Gradient border and atmosphere are opt-in typed inputs, defaulting to the current Organiza visual direction where appropriate. | A B2B application can use the same components without festive gradients. | y |
| Form state | Closed field components expose signal-friendly `model()` values and remain compatible with Angular reactive forms. `OrgTimeField` owns its custom `HH:mm` editor and never delegates its visual/interaction contract to `input[type=time]`. | Avoids browser-native time-control drift while retaining Angular Material form semantics. | y |
| Documentation | Every public component receives a collapsed, copyable "Uso recomendado" example in the showcase. | The catalog must guide both humans and AI-assisted feature work. | y |
| Accessibility | New interactive components keep native Material semantics and provide a 48px minimum touch target. | Preserves the project WCAG and Material baseline. | y |
| Visual ownership | Shared tokens and the owning `Org*` component stylesheet are the only location for component color, border, radius, hover, focus, density, and Material token rules. Feature styles may define layout placement and domain-only content only. | This makes a component correction propagate everywhere and prevents CSS ambiguity. | y |
| Migration proof | The final structural contract rejects legacy directive imports/selectors and component-level Material token overrides outside `shared/ui`, except explicitly documented showcase fixtures. | A search-backed gate makes the source-of-truth rule enforceable instead of aspirational. | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Closed action and selection contracts

**User Story**: As a feature developer, I want typed action and selection components so that I can compose a screen without choosing arbitrary Material variants or adding local styling.

**Why P1**: Buttons, icon buttons, chips, toggles, checkboxes, and radios are used across nearly every screen and are the most visible source of visual drift.

**Acceptance Criteria**:

1. WHEN a developer renders `OrgButtonComponent`, `OrgIconButtonComponent`, or `OrgChipComponent`, THEN the library SHALL expose explicit typed variants, disabled state, and optional gradient treatment without requiring a styling directive. <!-- ACT-01 -->
2. WHEN a developer renders a selection component, THEN the library SHALL provide closed APIs for toggle, checkbox, and radio-group semantics with an accessible label and a 48px minimum interactive target. <!-- SEL-01 -->
3. WHERE a festive border is disabled, the action and selection components SHALL render their semantic surface without a gradient border. <!-- ACT-02 -->
4. WHILE an action is disabled, the component SHALL not emit its activation output. <!-- ACT-03 -->
5. WHEN an existing application screen uses an action or selection control in scope, THEN the screen SHALL compose the corresponding closed `Org*` component instead of an `Org*Directive` or a feature-owned Material style override. <!-- MIG-01 -->

**Independent Test**: Render each component in a host fixture, vary inputs, activate it, and assert its DOM semantics and typed event/output behavior.

### P1: Closed field contracts

**User Story**: As a feature developer, I want a uniform family of fields so that text, select, date, time, and multiline input preserve Material sizing and shared feedback behavior.

**Why P1**: The date/time visual regressions showed that showcase-only CSS cannot reliably maintain field geometry across the application.

**Acceptance Criteria**:

1. WHEN a developer renders a text, select, date, time, or textarea field, THEN the library SHALL render an Angular Material outline field with an explicit label and signal-compatible value API. <!-- FLD-01 -->
2. WHEN date and time fields render beside a standard text field, THEN the library SHALL preserve the native Material field height and vertically centered control value without clipping; `OrgTimeField` SHALL own a custom, configurable `HH:mm` editor with typed minute increments, optional typed quick-time choices, and optional minimum/maximum limits, and SHALL NOT render `input[type=time]`. <!-- FLD-02 -->
3. IF a field is disabled, THEN the component SHALL prevent value-change output while retaining its accessible disabled state. <!-- FLD-03 -->
4. WHERE a hint or error message is supplied, the field SHALL render it through Material-supported hint or error semantics. <!-- FLD-04 -->
5. WHEN an existing application screen renders an in-scope field, THEN the screen SHALL compose the corresponding closed field component and SHALL not apply component appearance rules through feature SCSS. <!-- MIG-02 -->

**Independent Test**: Change a field value in a component fixture and assert the model/output, then verify disabled and hint/error paths independently.

### P1: Navigation, progress, and data-display contracts

**User Story**: As a feature developer, I want reusable navigation and data components so that tabs, steps, menus, status badges, metrics, and progress use the same responsive visual rules.

**Why P1**: These are currently live demos rather than reusable contracts, so gradients, spacing, and mobile behavior can diverge per screen.

**Acceptance Criteria**:

1. WHEN a developer renders tabs, a stepper, a navigation list, or a menu, THEN the library SHALL expose a closed component API with projected content and keyboard-accessible native Material behavior. <!-- NAV-01 -->
2. WHEN the viewport is below 600px, THEN the stepper component SHALL use its documented compact orientation without horizontal page overflow. <!-- NAV-02 -->
3. WHEN a developer renders a progress indicator, metric card, or status badge, THEN the library SHALL expose typed semantic variants and an optional theme-aware gradient presentation. <!-- DATA-01 -->
4. WHERE gradient presentation is disabled, the navigation and data components SHALL use their semantic non-gradient tokens. <!-- DATA-02 -->
5. WHEN an existing application screen renders an in-scope surface, navigation, progress, or data component, THEN the screen SHALL compose the corresponding `Org*` component and preserve its domain behavior. <!-- MIG-03 -->

**Independent Test**: Render each family in a host fixture and assert projected content, semantic variant classes/tokens, and the compact stepper selection logic.

### P2: Overlay and documentation governance

**User Story**: As a maintainer, I want reusable overlay contracts and authoritative documentation so that screens use consistent feedback and AI-assisted work can select the right component.

**Why P2**: The snackbar, dialog, menu, and code examples must communicate a coherent surface contract instead of isolated showcase styling.

**Acceptance Criteria**:

1. WHEN a developer opens an `OrgDialogComponent` or uses the feedback overlay API, THEN the system SHALL render the current theme's glass surface and preserve Material dialog accessibility semantics. <!-- OVR-01 -->
2. WHEN a component is added to the public `shared/ui` API, THEN the design-system showcase SHALL contain a live example and a collapsed "Uso recomendado" code example for that component family. <!-- DOC-01 -->
3. WHEN a maintainer selects light, dark, or a seasonal theme in the application, THEN showcase component borders, foregrounds, and optional gradients SHALL resolve through shared theme tokens rather than local hard-coded colors. <!-- DOC-02 -->
4. IF a public API is legacy directive-only, THEN the documentation SHALL mark it as legacy and direct new work to its closed component equivalent. <!-- DOC-03 -->
5. The application SHALL contain no in-scope legacy directive import or selector outside `shared/ui` after migration. <!-- CSS-01 -->
6. The application SHALL contain no feature-owned Angular Material token override or component appearance selector for an in-scope `Org*` component after migration. <!-- CSS-02 -->

**Independent Test**: Inspect the public barrel and showcase sections, then exercise the overlay under a test theme and assert the documented component reference is present.

## Edge Cases

- IF an unsupported variant is provided through a template binding, THEN the component SHALL fall back to its documented default semantic variant.
- IF projected navigation content is empty, THEN the wrapper SHALL render no invalid interactive control.
- WHEN a gradient is disabled in dark mode, THEN the component SHALL retain readable foreground and semantic border contrast.
- WHEN a field receives an empty value, THEN it SHALL preserve its label and not emit an invalid value transformation.
- IF a migration would require a business-behavior change, THEN the task SHALL preserve the existing event handler, validation, and accessible label through the component API before removing legacy markup.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ACT-01 | P1: Closed action and selection contracts | Tasks | Pending |
| SEL-01 | P1: Closed action and selection contracts | Tasks | Pending |
| ACT-02 | P1: Closed action and selection contracts | Tasks | Pending |
| ACT-03 | P1: Closed action and selection contracts | Tasks | Pending |
| FLD-01 | P1: Closed field contracts | Tasks | Pending |
| FLD-02 | P1: Closed field contracts | Tasks | Pending |
| FLD-03 | P1: Closed field contracts | Tasks | Pending |
| FLD-04 | P1: Closed field contracts | Tasks | Pending |
| NAV-01 | P1: Navigation, progress, and data-display contracts | Tasks | Pending |
| NAV-02 | P1: Navigation, progress, and data-display contracts | Tasks | Pending |
| DATA-01 | P1: Navigation, progress, and data-display contracts | Tasks | Pending |
| DATA-02 | P1: Navigation, progress, and data-display contracts | Tasks | Pending |
| OVR-01 | P2: Overlay and documentation governance | Tasks | Pending |
| DOC-01 | P2: Overlay and documentation governance | Tasks | Pending |
| DOC-02 | P2: Overlay and documentation governance | Tasks | Pending |
| DOC-03 | P2: Overlay and documentation governance | Tasks | Pending |
| MIG-01 | P1: Closed action and selection contracts | Tasks | Pending |
| MIG-02 | P1: Closed field contracts | Tasks | Pending |
| MIG-03 | P1: Navigation, progress, and data-display contracts | Tasks | Pending |
| CSS-01 | P2: Overlay and documentation governance | Tasks | Pending |
| CSS-02 | P2: Overlay and documentation governance | Tasks | Pending |

**Coverage:** 21 total, 0 mapped to tasks, 21 unmapped until design is approved.

## Success Criteria

- [ ] New feature work can choose documented `Org*` components for the priority component families without importing a styling directive.
- [ ] Every new public component has a unit test covering its API contract and a live `/design-system` example with code.
- [ ] The showcase retains a horizontally safe mobile layout and readable light/dark/seasonal token treatment.
- [ ] Existing product routes continue to render without migration regressions and consume the new component contracts for every priority family.
- [ ] A deterministic structural check proves there is no duplicate in-scope visual contract in feature CSS or legacy directive consumer outside `shared/ui`.
