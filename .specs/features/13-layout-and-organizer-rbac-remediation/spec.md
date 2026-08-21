# Feature 13 — Layout Remediation and Organizer RBAC Regression Coverage

## Problem Statement

The current screenshot baselines expose visible mobile defects that existing passing checks do not detect: the collaborator dialog has almost no internal padding, the event-editor capture can be horizontally offset after step interaction, and profile editing is not verified against the same form-field standard as the rest of the product. The organizer authorization guards are present, but several end-to-end journeys still use `/admin` for organizer work, obscuring the intended boundary between `/meus-eventos` and the Super Admin area.

## Goals

- [ ] Make collaborator, profile, event-detail, and event-editor surfaces meet the mobile spacing, form-field, color, and touch-target rules in `DESIGN.md`.
- [ ] Make screenshots represent the left edge of the current application scroll container after interactions.
- [ ] Verify the organizer journey as an ordinary authenticated user on `/meus-eventos`, while keeping `/admin` guarded for Super Admins.
- [ ] Add regression assertions that fail for insufficient dialog insets, horizontal capture displacement, mobile clipping, and incorrect organizer routes.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Building a new Super Admin metrics product | No separate metrics screen exists; this remediation verifies the current guard boundary without inventing a new domain. |
| Changing event owner/collaborator permissions | AD-017 remains unchanged; this work only protects route and presentation regressions. |
| Replacing the application-wide Material theme | The existing `--org-*` and MDC token system remains the source of truth. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Minimum inset inside the collaborator dialog | 16px on mobile and 24px at 600px and above | Matches the mobile and desktop card/modal rhythm in `DESIGN.md`. | Yes |
| Mobile page edge inset | At least 12px for the event editor and event detail | This is the AD-031 lower bound and prevents edge clipping. | Yes |
| Profile editing form standard | Use the shared outlined Material field and the existing `--org-*`/`--mat-sys-*` tokens, with signal input binding | Avoids a local visual variant and conforms to the Angular signal-form guidance. | Yes |
| Organizer versus Super Admin audit scope | Correct stale organizer test paths and test the established guard behavior; do not create a metrics dashboard | The user requested verification and layout remediation, while no metrics UI is implemented. | Yes |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Consistent mobile surfaces and inputs ⭐ MVP

**User Story**: As a mobile organizer, I want dialogs, profile inputs, event details, and editor forms to preserve their intended insets and visual language so that controls never appear clipped or improvised.

**Why P1**: These are directly visible defects in the current visual baselines.

**Acceptance Criteria**:

1. WHEN the collaborator invitation dialog is opened on a viewport narrower than 600px THEN the system SHALL keep its title, content, input, action, and close control at least 16px inside the dialog surface. <!-- event-driven -->
2. WHERE the collaborator invitation dialog is rendered at 600px or wider the system SHALL use 24px internal dialog insets without reducing any primary action below 48px high. <!-- optional-feature -->
3. WHEN profile name editing is opened THEN the system SHALL render the name label and outlined input with the shared Material 3 form-field tokens and `--org-primary` focus treatment. <!-- event-driven -->
4. WHILE the event editor or event detail is rendered below 600px the system SHALL keep every main card and form field at least 12px from the viewport edge without clipping its label, outline, or value. <!-- state-driven -->
5. The system SHALL use `--org-*` and `--mat-sys-*` colors for all modified form, dialog, and event-detail states. <!-- ubiquitous -->

**Independent Test**: Open the collaborator dialog and profile edit mode on Mobile Chrome, then inspect their field bounds, actions, focus color, and screenshots; open the event editor and event detail at the same viewport and inspect their edge insets.

### P1: Faithful visual capture and mobile regression detection ⭐ MVP

**User Story**: As a maintainer, I want the visual tests to capture the actual page origin after form interactions so that a green baseline cannot hide horizontal displacement.

**Why P1**: The current Step 2 baseline is visibly shifted despite passing the existing overflow check.

**Acceptance Criteria**:

1. WHEN a visual screenshot is captured THEN the system SHALL reset both the window and the application scroll container to horizontal and vertical origin before the image is created. <!-- event-driven -->
2. WHEN the Event Editor advances to the ViaCEP-populated address step on Mobile Chrome THEN the system SHALL capture the editor with `scrollLeft` equal to `0` and the editor surface fully visible from its left edge. <!-- event-driven -->
3. The system SHALL assert `document.documentElement.scrollWidth <= window.innerWidth + 1` and the affected visual-surface insets on the mobile collaborator, profile-edit, event-editor, and event-detail flows. <!-- ubiquitous -->

**Independent Test**: Run the focused mobile Playwright paths and inspect their regenerated screenshots; each starts at the page origin with no left-edge loss.

### P1: Organizer route and role-boundary regression coverage ⭐ MVP

**User Story**: As an ordinary authenticated organizer, I want event-management journeys to use `/meus-eventos` and never rely on Super Admin access so that roles remain comprehensible and protected.

**Why P1**: Stale `/admin` routes in organizer E2E scenarios can mask an RBAC regression.

**Acceptance Criteria**:

1. WHERE an authenticated user is not a Super Admin the system SHALL allow organizer dashboard, event-editor, collaborator, and share journeys through `/meus-eventos` without rendering an admin-only navigation entry. <!-- optional-feature -->
2. WHEN a non-Super-Admin user navigates to `/admin` THEN the system SHALL redirect that user to `/meus-eventos`. <!-- event-driven -->
3. The system SHALL keep `/meus-eventos` protected by `authGuard` and `/admin` protected by `superAdminGuard`. <!-- ubiquitous -->

**Independent Test**: Run the organizer flows with a non-whitelisted test email, assert their `/meus-eventos` URLs, and assert that `/admin` redirects to `/meus-eventos`.

## Edge Cases

- IF a dialog has enough content to scroll vertically on a small viewport THEN the system SHALL preserve its 16px content inset while allowing internal scrolling rather than horizontal clipping.
- IF a Playwright interaction causes the application scroll container to move horizontally THEN the screenshot helper SHALL restore its origin before capture.
- IF an organizer lacks Super Admin status THEN the system SHALL not expose an `/admin` navigation control or require an `/admin` route for event editing.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| LAYOUT-01 | P1: Consistent mobile surfaces and inputs | Design | Pending |
| LAYOUT-02 | P1: Consistent mobile surfaces and inputs | Design | Pending |
| LAYOUT-03 | P1: Consistent mobile surfaces and inputs | Design | Pending |
| LAYOUT-04 | P1: Consistent mobile surfaces and inputs | Design | Pending |
| LAYOUT-05 | P1: Consistent mobile surfaces and inputs | Design | Pending |
| CAPTURE-01 | P1: Faithful visual capture | T1 | Implementing |
| CAPTURE-02 | P1: Faithful visual capture | T1 | Implementing |
| CAPTURE-03 | P1: Faithful visual capture | T1, T5 | Implementing |
| RBAC-01 | P1: Organizer route and role-boundary coverage | Design | Pending |
| RBAC-02 | P1: Organizer route and role-boundary coverage | Design | Pending |
| RBAC-03 | P1: Organizer route and role-boundary coverage | Design | Pending |

**Coverage:** 11 total, 11 mapped to design, 0 unmapped.

## Success Criteria

- [ ] Focused visual tests fail if dialog content has less than 16px mobile inset or if an editor screenshot is offset from the application origin.
- [ ] The affected desktop and mobile screenshots show complete card edges, labels, values, and dialog actions.
- [ ] Non-Super-Admin organizer tests run entirely on `/meus-eventos`; `/admin` remains Super Admin-only.
- [ ] Build, unit tests, and relevant Playwright suites pass without weakening existing assertions.
