---
type: gotcha
title: A conditional block projects into a named slot only with one root element
date: 2026-11-23
enforced_by:
  - e2e/tests/organizer/dashboard-roles.spec.ts
related: [../decisions/angular-architecture.md]
---

# Conditional projection needs one root

`<ng-content select="[orgSomething]">` takes an `@if` / `@for` block only when the block has a
**single root element** carrying the attribute. A comment, a second element or a nested `@if`
inside the block makes Angular project it into the default slot instead (or drop it), with no
error.

Seen on the dashboard: "Itens completos" moved to a plain line when an event has no items, written
as one `@if` with a comment and a nested `@if`; the line never showed. Two sibling `@if` blocks,
each with one root element, fixed it.

Keep projected conditional content as `@if (x) { <span orgSlot>…</span> }`, comments outside.
