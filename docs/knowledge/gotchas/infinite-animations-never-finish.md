---
type: gotcha
title: Waiting for every animation hangs when one of them loops forever
date: 2026-11-23
enforced_by:
  - e2e/tests/organizer/secret-santa.spec.ts
related: [../decisions/testing.md]
---

# Infinite animations never finish

E2E tests wait for an invitation to finish writing itself with
`el.getAnimations({ subtree: true }).map((a) => a.finished)`. An animation with
`animation-iteration-count: infinite` (the glow and stars around the secret santa's name) never
resolves `finished`, so the test times out after 45 s.

Leave the endless ones out:

```ts
el.getAnimations({ subtree: true })
  .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
  .map((a) => a.finished);
```

Related: an element screenshot (`locator.screenshot`) of something inside the app's scrolling
`main` can come out cut or mixed with other parts; scroll it into view and take a page screenshot.
