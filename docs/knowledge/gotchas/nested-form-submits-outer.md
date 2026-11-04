---
type: gotcha
title: A form inside a reactive form submits the outer one
date: 2026-11-03
related: [../decisions/angular-architecture.md]
---

# A form inside a reactive form submits the outer one

HTML forbids nested `<form>` elements, but Angular builds the DOM itself, so a `<form>` inside a `[formGroup]` form renders anyway. Its submit button then sends the **outer** form, and `(ngSubmit)` on the inner one never fires (it is only an output of `NgForm`/`FormGroupDirective`, which need the forms module imported in that component).

Seen in the RSVP drawer: "Novo membro" closed the drawer and saved nothing.

A sub-form that lives inside another form (a quick add inside a drawer) is a `<div role="group" aria-label="…">`; its button uses `(pressed)` on `org-button` (type `button`, the default), and Enter in its field is handled with `(keydown.enter)` and `preventDefault()`.
