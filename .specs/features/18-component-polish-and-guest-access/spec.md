# Feature 18 — Component polish and guest access boundary specification

## Problem Statement

The closed component migration exposed visual defects that are now visible in the
showcase and in real product routes: nested surface rings, inaccessible contrast,
placeholder interactions, and inconsistent component states. More critically, a
Firebase anonymous RSVP session can pass the organizer route guard even while the
application presents that visitor as signed out.

## Goals

- [x] Prevent anonymous RSVP sessions from opening organizer routes or editors.
- [x] Make the shared component owners render the reviewed states consistently in
      light, dark, and seasonal themes.
- [x] Make `/design-system` an executable, accurate catalog whose examples work
      and expose the exact composition code.
- [x] Remove the reviewed nested-surface and hover-boundary defects from the
      affected product screens.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Firestore rules redesign | This change fixes client route access; server authorization is verified separately. |
| New product workflows | The scope is correcting existing component behavior and consumers. |
| A visual rewrite of every route | Only the routes and component families evidenced in the review are migrated. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- |
| Home visibility | The home/event discovery route remains public. | The user explicitly asked for confirmation and public discovery is existing product behavior. | yes |
| Anonymous identity | Anonymous Firebase users remain available only for public RSVP state and are not organizer-authenticated. | This preserves RSVP support while closing the demonstrated route bypass. | yes |
| Chip interaction | Chips are static by default; selection requires explicit opt-in. | Labels such as event category and confirmed count are informational, not choices. | yes |
| Documentation disclosure | Every reviewed showcase family uses one collapsed `Uso recomendado` disclosure with exact demo code. | Removes duplicate labels and gives maintainers/AI a dependable reference. | yes |
| Remaining implicit dimensions | N/A for data lifecycle, retry, concurrency, rate limiting, and external dependencies. | This work has no write protocol or new remote dependency. | yes |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Organizer access is limited to identified users

**User Story**: As a visitor who reached a public event through RSVP, I want
public viewing to work without accidentally receiving organizer access.

**Why P1**: The current guard exposes organizer data and editing screens to an
anonymous session.

**Acceptance Criteria**:

1. WHEN an anonymous Firebase user navigates to `/meus-eventos` or an organizer child route, THEN the router SHALL redirect that user to `/login`. <!-- AUTH-01 -->
2. WHEN a non-anonymous authenticated user navigates to an organizer route, THEN the router SHALL allow the route. <!-- AUTH-02 -->
3. WHILE a user is unauthenticated or anonymous, THEN the public home route SHALL remain available. <!-- AUTH-03 -->

**Independent Test**: Seed an anonymous mock session, navigate directly to an
organizer route, and assert the login route; separately seed a normal user and
assert access.

### P1: Closed components own their reviewed visual and interaction contracts

**User Story**: As a feature developer, I want explicit component APIs for the
reviewed states so that a repair reaches every consumer rather than adding CSS
exceptions to each screen.

**Why P1**: The current surfaces, chips, fields, actions, metrics, navigation,
and overlays visibly drift between the showcase and product screens.

**Acceptance Criteria**:

1. WHEN a chip is rendered without selection enabled, THEN the library SHALL render a non-selectable Material chip without an option role or selection check. <!-- CMP-01 -->
2. WHEN a component requests a gradient border or foreground, THEN the library SHALL resolve it through shared theme tokens and preserve readable foreground contrast in light, dark, and seasonal themes. <!-- CMP-02 -->
3. WHEN a component requests a non-gradient presentation, THEN the library SHALL render its documented semantic background, border, and foreground without a hidden gradient ring. <!-- CMP-03 -->
4. WHEN a time, date, select, or textarea field is rendered, THEN the library SHALL preserve the normal Material field geometry and shall expose the reviewed suffix, selection, and optional counter behaviors through the component API. <!-- CMP-04 -->
5. WHEN a tab, navigation-list item, stepper, or menu item is activated, THEN the library SHALL perform its documented state change or emitted action and SHALL not navigate to an unrelated route. <!-- CMP-05 -->
6. WHILE a data card, banner, guest list, or product event card renders in scope, THEN it SHALL contain one owned surface ring rather than a nested or square visual boundary. <!-- CMP-06 -->

**Independent Test**: Render the affected closed components in host fixtures and
assert their semantic element/state classes; exercise representative interactions
in the showcase and product routes.

### P1: The showcase documents the actual component compositions

**User Story**: As a maintainer using AI assistance, I want each catalog example
to be interactive and documented exactly so that I can reproduce it without
copying incidental page CSS.

**Why P1**: Several examples are static placeholders, visually inconsistent, or
show duplicate/incomplete code guidance.

**Acceptance Criteria**:

1. WHEN a reviewed showcase section is visible, THEN it SHALL expose a single collapsed `Uso recomendado` disclosure with the exact composition used in the visible demo. <!-- DOC-01 -->
2. WHEN a seasonal theme is selected in the showcase, THEN the selected card and matching drawer item SHALL expose an accessible active state. <!-- DOC-02 -->
3. WHEN a reviewer switches tabs, menus, lists, or steppers in the showcase, THEN the demo SHALL visibly change its documented state; the stepper catalog SHALL include an explicit vertical example. <!-- DOC-03 -->
4. WHEN a showcase section uses a title, token, feedback message, menu, or dialog, THEN it SHALL resolve through the active shared theme and retain readable contrast. <!-- DOC-04 -->
5. WHEN a maintainer opens the typography foundation, THEN the catalog SHALL identify the display, interface, and mono families, their tokenized scale, and Material Icons as the icon source. <!-- DOC-05 -->

**Independent Test**: Exercise each reviewed demo interaction and inspect its
single disclosure and theme-aware computed classes.

### P2: Product consumers visibly inherit the repaired contracts

**User Story**: As a user of home and event management, I want repaired shared
components to make the pages coherent without duplicate borders or unreadable
controls.

**Why P2**: The review found defects in the public card, organizer filter, and
event editor consumers.

**Acceptance Criteria**:

1. WHEN a visitor hovers or focuses a home event card, THEN the card SHALL animate as one continuous surface without exposing an inner square boundary. <!-- APP-01 -->
2. WHILE the dashboard uses dark theme, THEN inactive event filters SHALL meet the shared on-surface-variant contrast contract. <!-- APP-02 -->
3. WHEN the editor renders collaborator guidance, share information, or guest actions, THEN each reviewed block SHALL use its owning banner or surface component without nested card rings and with aligned icon, heading, count, and actions. <!-- APP-03 -->

**Independent Test**: Capture desktop and mobile screenshot assertions for the
reviewed routes in a signed-in and anonymous state as applicable.

## Edge Cases

- IF a chip is disabled, THEN the component SHALL not emit a selection change.
- IF a time value cannot be parsed or violates configured bounds, THEN the time
  component SHALL retain the last valid value.
- IF a navigation item has no route target, THEN it SHALL render an action
  control rather than an anchor with an unrelated fallback destination.
- IF an active seasonal card is selected in dark mode, THEN its selected state
  SHALL remain distinguishable without depending only on color.
- IF a gradient foreground is applied, THEN the component SHALL use the semantic
  on-gradient token rather than inherit a dark icon/text color.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AUTH-01 | P1: Organizer access | T1 | Complete |
| AUTH-02 | P1: Organizer access | T1 | Complete |
| AUTH-03 | P1: Organizer access | T1 | Complete |
| CMP-01 | P1: Closed components | T2 | Complete |
| CMP-02 | P1: Closed components | T2, T5 | Complete |
| CMP-03 | P1: Closed components | T2, T5 | Complete |
| CMP-04 | P1: Closed components | T3 | Complete |
| CMP-05 | P1: Closed components | T4 | Complete |
| CMP-06 | P1: Closed components | T5, T6 | Complete |
| DOC-01 | P1: Showcase documentation | T7 | Complete |
| DOC-02 | P1: Showcase documentation | T7 | Complete |
| DOC-03 | P1: Showcase documentation | T4, T7 | Complete |
| DOC-04 | P1: Showcase documentation | T5, T7 | Complete |
| DOC-05 | P1: Showcase documentation | T7 | Complete |
| APP-01 | P2: Product consumers | T6 | Complete |
| APP-02 | P2: Product consumers | T6 | Complete |
| APP-03 | P2: Product consumers | T6 | Complete |

**Coverage:** 17 total, 17 mapped to completed tasks, 0 unmapped.

## Success Criteria

- [x] An anonymous session cannot open organizer routes, while public discovery stays public.
- [x] The 33 annotated defects have a component-owner or product-consumer correction and regression evidence.
- [x] The showcase has working representative interactions and exact collapsed code examples.
- [x] Shared visual repairs are delivered through `Org*` components and tokens, not feature-owned component styling.
