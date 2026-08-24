# Feature 16 — Convívio-Inspired Design-System Validation

## Objective

Create an isolated, reviewable visual direction in `/design-system` based on the supplied reference without changing production feature screens.

## Scope

- Showcase-only visual tokens: Fraunces display type, Inter body type, JetBrains Mono annotations, coral and amber calls to action, porcelain canvas, plum depth, and soft coloured shadows.
- A clear component-first migration proposal for later approval.
- Desktop and mobile showcase validation.

## Explicitly out of scope

- Changing existing feature components, shared directives, or existing global `--org-*` tokens.
- Migrating screens to the new visual direction.
- Replacing existing directives before the visual direction is approved.

## Acceptance criteria

1. WHEN a super administrator opens `/design-system`, THEN the showcase SHALL render the proposed visual direction without affecting product routes.
2. WHEN the showcase title or section headings render, THEN they SHALL use Fraunces; interface copy SHALL use Inter; token labels SHALL use JetBrains Mono.
3. WHEN a primary preview action renders, THEN it SHALL use the coral-to-amber invitation gradient and a 16px rounded treatment.
4. WHEN the showcase renders at 320px, THEN it SHALL not introduce horizontal overflow and shall retain 48px interactive navigation targets.
5. WHEN the proposal is approved for migration, THEN new shared primitives SHALL be implemented as closed Angular components with explicit inputs and content projection, not as styling directives.
