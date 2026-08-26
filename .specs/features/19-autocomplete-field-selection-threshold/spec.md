# Feature 19 — Autocomplete field selection threshold specification

## Problem Statement

Long dropdowns force people to scan a menu even when they already know the
option they need. The library has a closed select component, but it does not
express when a searchable control is the canonical choice. This creates an
opportunity for feature code to choose inconsistent Material controls.

## Goals

- [ ] Establish one selection threshold for the shared UI library.
- [ ] Provide a typed, accessible, closed autocomplete field for four or more
      options.
- [ ] Migrate the existing six-option family relationship controls and document
      the decision in the live catalog.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Remote option loading | The current option sources are local and typed. |
| Multi-select autocomplete | It is a distinct interaction from one-value field selection. |
| Custom option templates or grouping | The first API must remain explicit and small. |
| Migrating future product fields pre-emptively | Only current consumers with more than three options are in scope. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- |
| Selection threshold | `org-select-field` is canonical for one to three options; `org-autocomplete-field` is canonical for four or more. | The user explicitly set the boundary at more than three choices. | yes |
| Search matching | Filtering ignores case and Portuguese diacritics and matches any part of the option label. | It makes an autocomplete useful for the product's Portuguese labels without changing option values. | yes |
| Free text | A typed string is not a selected value until it matches a chosen option. | The value model must remain one of the typed option values. | yes |
| Remaining implicit dimensions | N/A for persistence, external dependencies, retries, concurrency, authorization, and data lifecycle. | The feature is local UI selection only. | yes |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Searchable single-value selection

**User Story**: As a person filling an Organiza AI form, I want a searchable
field for longer option lists so that I can find an option without scanning a
large dropdown.

**Why P1**: The rule is only useful when the library provides the corresponding
closed component.

**Acceptance Criteria**:

1. WHEN `org-autocomplete-field` receives typed options, THEN the component SHALL render a Material autocomplete whose displayed choices match the typed labels. <!-- AUTO-01 -->
2. WHEN a user types text, THEN the component SHALL display only option labels containing the query after case and diacritic normalization. <!-- AUTO-02 -->
3. WHEN a user selects an enabled option, THEN the component SHALL emit and model that option's typed `value` and display its `label`. <!-- AUTO-03 -->
4. IF the query has no matching options, THEN the component SHALL display `Nenhuma opção encontrada.` and SHALL not create a free-text selected value. <!-- AUTO-04 -->
5. WHILE the field is disabled or an option is disabled, THEN the component SHALL not change its selected value from that interaction. <!-- AUTO-05 -->

**Independent Test**: Render six relationship options, filter by an accented or
case-varied term, select an enabled option, and assert the value and visible
label. Then type a non-matching term and assert the empty message and unchanged
selection contract.

### P1: One canonical threshold and documented usage

**User Story**: As a feature developer using the catalog, I want an explicit
selection rule and exact component code so that I do not choose a raw Material
control or an inconsistent field.

**Why P1**: The boundary must be discoverable before a feature creates another
selection implementation.

**Acceptance Criteria**:

1. WHEN a single-choice field has one, two, or three options, THEN the design system SHALL document `org-select-field` as the canonical component. <!-- AUTO-06 -->
2. WHEN a single-choice field has four or more options, THEN the design system SHALL document `org-autocomplete-field` as the canonical component. <!-- AUTO-07 -->
3. WHEN the fields section of `/design-system` is visible, THEN it SHALL show the autocomplete with at least four options and one collapsed `Uso recomendado` example containing the exact component API. <!-- AUTO-08 -->

**Independent Test**: Inspect the fields section for the threshold guidance,
the closed autocomplete element, and its one usage disclosure.

### P1: Existing long lists follow the rule

**User Story**: As a user adding a family member, I want the six available
relationship choices to use the same searchable field as the design system.

**Why P1**: The current product consumers already exceed the new threshold.

**Acceptance Criteria**:

1. WHEN a family relationship field renders its six existing options, THEN the application SHALL use `org-autocomplete-field` instead of `org-select-field`. <!-- AUTO-09 -->
2. WHEN a relationship is selected in either family flow, THEN the application SHALL preserve the existing `FamilyRelationship` payload value. <!-- AUTO-10 -->

**Independent Test**: Render each family flow, assert the autocomplete host is
present, and submit a selected relationship payload.

## Edge Cases

- IF the options collection is empty, THEN the autocomplete SHALL display
  `Nenhuma opção encontrada.` and keep the model empty.
- IF a prior selected value is written by a form, THEN the autocomplete SHALL
  display the matching option label.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AUTO-01 | P1: Searchable selection | T1 | Complete |
| AUTO-02 | P1: Searchable selection | T1 | Complete |
| AUTO-03 | P1: Searchable selection | T1 | Complete |
| AUTO-04 | P1: Searchable selection | T1 | Complete |
| AUTO-05 | P1: Searchable selection | T1 | Complete |
| AUTO-06 | P1: Canonical threshold | T2 | Pending |
| AUTO-07 | P1: Canonical threshold | T2 | Pending |
| AUTO-08 | P1: Canonical threshold | T2 | Pending |
| AUTO-09 | P1: Existing long lists | T2 | Pending |
| AUTO-10 | P1: Existing long lists | T2 | Pending |

**Coverage:** 10 total, 10 mapped to execution tasks, 0 unmapped.

## Success Criteria

- [ ] Four or more single-choice options use the documented autocomplete API.
- [ ] One to three single-choice options retain the documented select API.
- [ ] The catalog and two existing family flows prove the same closed component
      contract.
