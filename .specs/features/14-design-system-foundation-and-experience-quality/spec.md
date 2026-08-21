# Feature 14 — Design System Foundation and Experience Quality

## Problem Statement

The product has a token file but not a governed UI system. Repeated local and global overrides create duplicate card borders, segmented input outlines, clipped labels, mismatched field fills, weak icon treatment, inconsistent snackbars, and mobile layouts that can look correct to a document-level overflow assertion while content is cut inside the application scroll container.

The visual baselines also do not cover every supported page state in dark mode or the full content of the internal scroll surface. This leaves regressions undetected until a human reviews screenshots.

## Goals

- [ ] Establish a product-owned, reusable UI foundation in `src/app/shared/ui/` with stable tokens and standalone Angular OnPush primitives for surfaces, fields, labels, buttons, icon buttons, chips, icons, banners, drawers, and feedback.
- [ ] Move navigation and long-form workflows to accessible right-side drawers while retaining dialogs only for short confirmation actions.
- [ ] Preserve and govern seasonal theme integration on `html` (`theme-junina`, `theme-natal`, `theme-pascoa`, `theme-ano-novo`) to theme primary accents and festive overlays while maintaining crisp single-border glassmorphism, readable contrast, and standard feedback states.
- [ ] Capture every registered visual state in desktop/mobile and light/dark modes across all routes and drawer states, including all content in the internal application scroll area.
- [ ] Record names for non-family RSVP companions, not only a count, without changing the verified-identity rule for the primary attendee.

## Out of Scope

| Feature | Reason |
| --- | --- |
| A separately published npm package or a multi-repository component library | There is no second consumer yet. The first implementation must prove a stable internal API before extraction. |
| A visual rebrand or a new design direction | The Vibrant Celebration identity, Plus Jakarta Sans, glassmorphism, and purple-to-orange brand gradient remain in force. |
| Changing event permissions or verified RSVP identity | AD-017 and AD-024 remain unchanged. The primary guest remains the verified account holder. |
| Identifying, authenticating, or messaging each non-family companion | Companion names are attendance metadata for the organizer. They do not become independent authenticated guest records. |
| Replacing every existing component in one release | Migration is incremental and governed by the primitives and visual matrix. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Reusable boundary | Create `src/app/shared/ui/` with a documented public barrel covering surfaces, form controls, actions, chips, icons, feedback, and drawers without a new package workspace. | It is reusable inside this SaaS and ready to extract after a real second application proves the API. | Yes |
| Field composition | Use standalone form-field, label, and icon directives plus token recipes on native Material outlined fields; do not wrap or reproduce the Material form API. | The native `mat-form-field` keeps Reactive Forms, suffix/prefix, hints, and errors intact while one owned directive and MDC tokens standardize its visual contract. | Yes |
| Navigation density | The toolbar keeps brand, one hamburger trigger, and the profile/avatar trigger when authenticated. Route, theme, and logout actions move to the navigation drawer on desktop and mobile. | This directly resolves the crowded header while keeping frequent identity access visible. | Yes |
| Drawer behavior | Navigation, RSVP, and collaborator management open as end-positioned `mode="over"` drawers with a backdrop, Escape/backdrop close, focus restoration, and an explicit close control. | It gives long workflows room on all screen sizes without treating them as a small blocking confirmation. | Yes |
| Dialog behavior | Only destructive or irreversible confirmation flows continue to use `MatDialog`. | A short decision benefits from a modal focus trap; editable workflows do not. | Yes |
| Success feedback | All successful mutations use one custom snackbar component with a green success surface and `check_circle` icon. Errors use the same component family with an error variant. | A typed feedback API removes scattered text/action/duration combinations while preserving Material live announcements. | Yes |
| Seasonal appearance | Seasonal themes (`theme-junina`, `theme-natal`, `theme-pascoa`, `theme-ano-novo`) remain on `html`, styling primary gradients and festive overlays, while glassmorphism, field contrast, and semantic feedback tokens remain solid and accessible. | Seasonal themes enhance celebrations; keeping them on `html` preserves the festive experience while tokens prevent broken outlines or unreadable fills. | Yes |
| Additional companions | A count above zero reveals one required name field per companion, up to 10. The persisted `companions` array is the source of truth; legacy `companionsCount` remains readable and is derived on new writes. | Names answer the organizer's attendance question while a bound prevents accidental unbounded form and document payloads. | Yes |
| Companion visibility | Show named non-family companions only in organizer-facing guest management. | They are personal attendance data and have no public-profile purpose. | Yes |
| Visual states | A typed visual-scenario registry enumerates routed pages and overlay states. Every registered state produces four baselines: desktop/light, desktop/dark, mobile/light, mobile/dark. | A registry makes coverage auditable and prevents future pages from silently missing dark-mode screenshots. | Yes |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Governed shared surfaces and form controls ⭐ MVP

**User Story**: As a user, I want cards, inputs, and interactive controls to look and behave consistently so that forms and actions remain clear, accessible, and trustworthy in every theme and viewport.

**Why P1**: The screenshot findings are systemic consequences of unowned styling, including the white ring beside gradient borders in `13-17`, blue family fields in `13-15`, clipped active labels in `13-11`, and the inexplicable home badge outline.

**Acceptance Criteria**:

1. The system SHALL provide standalone, OnPush UI primitives for surfaces, form-fields, labels, buttons, icon buttons, chips, semantic icons, and banners through one documented `shared/ui` public API. <!-- ubiquitous -->
2. WHEN a component renders an `OrgSurface` card, panel, drawer, or confirmation surface THEN the system SHALL render exactly one 1.5px gradient border and SHALL not render a second white companion border. <!-- event-driven -->
3. WHEN an `OrgField` is idle, hovered, focused, invalid, disabled, or autofilled THEN the system SHALL use only its documented Material MDC token values, retain a readable semantic fill in light, dark, and seasonal modes, and keep the label fully visible. <!-- event-driven -->
4. WHEN a user focuses an outlined field THEN the system SHALL show one coherent primary focus treatment rather than separately colored leading, notch, and trailing outline segments. <!-- event-driven -->
5. The system SHALL give every primary button, icon button, expansion header, drawer action, filter chip, and field affordance a minimum 48px by 48px touch target. <!-- ubiquitous -->
6. WHEN a semantic UI action renders an icon THEN the system SHALL use the documented icon mapping and a size/color token for that action via `OrgIconComponent` rather than a local hard-coded icon treatment. <!-- event-driven -->

**Independent Test**: Render each primitive in light/dark and mobile/desktop component tests, then exercise representative Profile, RSVP, collaborator, editor, and Home visual scenarios.

---

### P1: Calm navigation and expansive workflows ⭐ MVP

**User Story**: As a user, I want a simple header and roomy side panels so that I can navigate and complete RSVP or collaboration work without a crowded toolbar or a cramped dialog.

**Why P1**: The current toolbar exposes several unrelated icons, the global drawer is empty, and `13-11` and `13-17` show complex forms constrained by dialog dimensions.

**Acceptance Criteria**:

1. WHEN the application header is visible THEN the system SHALL show the brand, one accessible menu trigger, and the authenticated user's profile/avatar trigger, with route, theme, and logout actions available in the navigation drawer. <!-- event-driven -->
2. WHEN a user opens the navigation menu on desktop or mobile THEN the system SHALL open an end-positioned navigation drawer with the actions authorized for that user and SHALL close it after route navigation. <!-- event-driven -->
3. WHEN a user opens RSVP or collaborator management THEN the system SHALL present the workflow in an end-positioned drawer with a visible title, close action, internal vertical scrolling, and no horizontal clipping. <!-- event-driven -->
4. WHEN a user presses Escape or activates the drawer backdrop or close control THEN the system SHALL close the drawer and restore focus to its trigger. <!-- event-driven -->
5. WHEN a user cancels an RSVP or another destructive action THEN the system SHALL use the existing short confirmation dialog pattern rather than a workflow drawer. <!-- event-driven -->

**Independent Test**: Use keyboard and pointer tests to open, navigate, close, and restore focus for navigation, RSVP, and collaborator drawers at both project viewports.

---

### P1: Uniform feedback and festive seasonal themes ⭐ MVP

**User Story**: As a user, I want success and error feedback to communicate the same meaning everywhere and seasonal theme palettes to celebrate events while keeping the interface clear and accessible.

**Why P1**: `13-12` uses a dark snackbar with a party emoji, while `13-15` uses a text-action snackbar. Previous global overrides distorted surface contrast during seasonal themes.

**Acceptance Criteria**:

1. WHEN a mutation succeeds THEN the system SHALL announce one `success` feedback variant with a green semantic surface, `check_circle` icon, `role="status"`, and the mutation message. <!-- event-driven -->
2. WHEN a recoverable mutation fails THEN the system SHALL announce one `error` feedback variant with an error semantic surface, error icon, and the failure message. <!-- event-driven -->
3. WHILE a feedback message has no user action the system SHALL dismiss it after the configured duration without moving keyboard focus. <!-- state-driven -->
4. WHILE an event seasonal theme is active THEN the system SHALL apply its seasonal class to the document to theme primary colors and gradients, and SHALL maintain clean single-border surface glassmorphism, readable field contrast, and standard feedback states. <!-- state-driven -->
5. WHERE an event has a seasonal classification THEN the system SHALL render its festive overlays and category highlights harmoniously with the active seasonal theme. <!-- optional-feature -->

**Independent Test**: Trigger profile, RSVP, event editor, share, and dashboard successes/failures and assert the same feedback structure; compare default and seasonal event scenarios.

---

### P1: Complete RSVP companion information ⭐ MVP

**User Story**: As an organizer, I want the RSVP to name non-family companions so that the attendance list is actionable instead of only a number.

**Why P1**: The current `companionsCount` field in the RSVP dialog supplies a total but does not identify the people represented by it.

**Acceptance Criteria**:

1. WHEN an attendee sets the number of non-family companions above zero THEN the system SHALL reveal exactly that many required name inputs, labelled `Acompanhante 1` through `Acompanhante N`. <!-- event-driven -->
2. IF the attendee enters a count outside the inclusive range 0 through 10, or leaves a revealed companion name blank, THEN the system SHALL prevent RSVP submission and identify the invalid input. <!-- unwanted-behavior -->
3. WHEN an RSVP with named companions is saved THEN the system SHALL atomically persist the primary verified guest and its ordered companion-name array, and SHALL write the matching legacy count for existing aggregate readers. <!-- event-driven -->
4. WHILE reading a legacy RSVP that has only `companionsCount` the system SHALL retain its aggregate contribution without inventing companion names. <!-- state-driven -->
5. WHEN the primary RSVP is cancelled THEN the system SHALL remove its companion metadata together with the primary record and any linked family records. <!-- event-driven -->

**Independent Test**: Submit 0, 1, and multiple companions; test blank, negative, and greater-than-10 values; read a legacy record; and cancel a saved RSVP.

---

### P1: Full visual regression matrix ⭐ MVP

**User Story**: As a team member, I want reliable complete screenshots in both themes and viewports so that visual regressions are caught before review.

**Why P1**: `fullPage: true` captures the document but the app has an internal `main.app-content` scroll owner, leaving lower content absent from the current baseline files.

**Acceptance Criteria**:

1. WHEN a registered visual scenario is captured THEN the system SHALL capture every registered semantic scroll anchor in the internal `main.app-content` surface, including content below its initial fold. <!-- event-driven -->
2. WHEN a registered visual scenario is captured THEN the system SHALL reset all relevant scroll origins and wait for fonts, animations, and overlay layout to settle before capture. <!-- event-driven -->
3. The system SHALL register and run every supported routed page and workflow drawer state in desktop/light, desktop/dark, mobile/light, and mobile/dark variants. <!-- ubiquitous -->
4. IF a registered scenario lacks one required theme-viewport variant, has document or app-scroll horizontal overflow, clips a required control, or fails its token assertion THEN the visual suite SHALL fail. <!-- unwanted-behavior -->
5. WHEN a page has vertically long content THEN the system SHALL additionally scroll each registered critical region into view before its localized assertion. <!-- event-driven -->

**Independent Test**: Run the visual matrix with deterministic mocks and verify each manifest entry produces four full-content artifacts plus its numerical layout assertions.

---

## Edge Cases

- IF a drawer exceeds the mobile viewport height THEN the system SHALL keep its close control and actions reachable through internal vertical scrolling without horizontal page overflow.
- IF a field uses browser autofill THEN the system SHALL retain the same documented field fill and text contrast instead of a blue browser-controlled fill.
- IF a visual scenario starts with dark mode persisted in local storage THEN the system SHALL capture its dark variant without relying on a previous test to toggle the theme.
- IF a long email, address, event title, or companion name is rendered THEN the system SHALL wrap, truncate, or scroll its local control according to the primitive contract and SHALL not widen the application canvas.
- IF an old RSVP has a count but no companion array THEN the system SHALL include that count in totals and SHALL not show fabricated name controls after loading.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| DS-01 | Shared surfaces and form controls | Design | In Design |
| DS-02 | Shared surfaces and form controls | Execute | In progress — T3 geometry assertion complete |
| DS-03 | Shared surfaces and form controls | Design | In Design |
| DS-04 | Shared surfaces and form controls | Execute | In progress — T3 field coherence assertion complete |
| DS-05 | Shared surfaces and form controls | Execute | In progress — T3 touch/drawer assertions complete |
| DS-06 | Shared surfaces and form controls | Design | In Design |
| NAV-01 | Calm navigation and workflows | Design | In Design |
| NAV-02 | Calm navigation and workflows | Design | In Design |
| NAV-03 | Calm navigation and workflows | Design | In Design |
| NAV-04 | Calm navigation and workflows | Design | In Design |
| NAV-05 | Calm navigation and workflows | Design | In Design |
| FEED-01 | Uniform feedback and accents | Design | In Design |
| FEED-02 | Uniform feedback and accents | Design | In Design |
| FEED-03 | Uniform feedback and accents | Design | In Design |
| THEME-01 | Uniform feedback and accents | Design | In Design |
| THEME-02 | Uniform feedback and accents | Design | In Design |
| RSVP-01 | Complete RSVP companion information | Design | In Design |
| RSVP-02 | Complete RSVP companion information | Design | In Design |
| RSVP-03 | Complete RSVP companion information | Design | In Design |
| RSVP-04 | Complete RSVP companion information | Design | In Design |
| RSVP-05 | Complete RSVP companion information | Design | In Design |
| VIS-01 | Full visual regression matrix | Execute | In progress — T2 anchor capture complete |
| VIS-02 | Full visual regression matrix | Execute | In progress — T2 settling and T4 tracked comparison configuration complete |
| VIS-03 | Full visual regression matrix | Execute | In progress — T1 registry complete; T29 will add migrated scenarios |
| VIS-04 | Full visual regression matrix | Execute | In progress — T3 numerical assertions complete |
| VIS-05 | Full visual regression matrix | Execute | In progress — T2 resets scroll origins and waits for fonts |

**Coverage:** 26 total, 0 mapped to tasks, 26 unmapped while Design is in progress.

## Success Criteria

- [ ] The cited screenshots no longer show split field outlines, double surface borders, blue autofill-like field fills, clipped labels, or mobile clipping.
- [ ] Every registered route and workflow state has complete, anchor-based desktop/mobile light/dark visual artifacts and deterministic layout assertions.
- [ ] A single typed feedback API renders the same green success snackbar for every successful mutation.
- [ ] The header exposes one menu trigger plus the profile control, and all long workflows use accessible end drawers.
- [ ] The RSVP records named non-family companions while preserving aggregate compatibility for existing data.
