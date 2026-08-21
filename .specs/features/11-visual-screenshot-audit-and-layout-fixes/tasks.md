# Visual Screenshot Audit & Responsive Layout Fixes (Mobile-First) Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/11-visual-screenshot-audit-and-layout-fixes/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Test Helpers & Utilities | none | - (build gate only) | `e2e/helpers/*.ts` | `npm run build` |
| Application Layout & Styles (SCSS/HTML) | none | - (build gate only) | `src/app/**/*.scss`, `src/app/**/*.html` | `npm run build` |
| Visual Regression & Overflow Spec | e2e | Zero horizontal overflow on mobile + WCAG 2.5.5 AA touch target assertions | `e2e/specs/07-visual-layout.spec.ts` | `npm run test:e2e` |
| Screenshot Baseline Suite | e2e | 14+ full-page screenshots captured across desktop and mobile viewports | `e2e/screenshots/*.png` | `npm run test:e2e` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After SCSS, template markup, or test helper tasks | `npm run build` |
| Full | After E2E visual layout spec updates or verification | `npm run test:e2e` |
| Build | After phase completion or full suite verification | `npm run build && npm test -- --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation & Automated Visual Verification Helper

Foundational test helper functions for asserting zero horizontal overflow and minimum touch target size.

```
T1
```

### Phase 2: Toolbar & App Header Mobile-First Responsiveness

Mobile-first responsive refactoring of the top navigation bar, login CTA label, and viewport edge margins.

```
T2 → T3
```

### Phase 3: Event Editor Stepper & Form Responsiveness

Eliminate mobile horizontal blowout across Stepper headers, Date/Time row, and Address multi-column grids.

```
T4 → T5 → T6
```

### Phase 4: Organizer Dashboard & Filter Chips Responsiveness

Enable smooth horizontal chip scrolling, 48px touch targets, and mobile metadata card stacking on the dashboard.

```
T7 → T8
```

### Phase 5: Profile & Family Roster Form Layout

Refactor profile padding and family roster member form from 1-column mobile stacking to 3-column desktop grid.

```
T9 → T10
```

### Phase 6: Home & Event Detail Visual Alignment

Refactor home event card grid, event detail hero section padding, typography hierarchy, and glassmorphic dialogs.

```
T11 → T12 → T13
```

### Phase 7: Automated Visual Verification & Screenshot Refresh

Automated overflow and layout testing in Playwright with complete refresh of visual screenshot baselines.

```
T14 → T15
```

---

## Task Breakdown

### Phase 1: Foundation & Automated Visual Verification Helper

#### T1: Implement assertNoHorizontalOverflow Helper in DesignTokensHelper

**What**: Add `assertNoHorizontalOverflow(page)` helper in `e2e/helpers/design-tokens.helper.ts` verifying `document.documentElement.scrollWidth <= window.innerWidth`.  
**Where**: `e2e/helpers/design-tokens.helper.ts`  
**Depends on**: None  
**Reuses**: `e2e/helpers/design-tokens.helper.ts`  
**Requirement**: LAYOUT-22, LAYOUT-23  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `assertNoHorizontalOverflow(page)` exported and evaluates `scrollWidth` vs `clientWidth`/`innerWidth`
- [x] Provides descriptive error output if horizontal overflow is detected
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement assertNoHorizontalOverflow helper in design tokens`  

---

### Phase 2: Toolbar & App Header Mobile-First Responsiveness

#### T2: Refactor Toolbar HTML for Responsive Login CTA

**What**: Update `src/app/app.html` to wrap login button label text for responsive mobile display while preserving `aria-label="Acessar ou cadastrar"`.  
**Where**: `src/app/app.html`  
**Depends on**: None  
**Reuses**: `src/app/app.html`  
**Requirement**: LAYOUT-01, LAYOUT-02, LAYOUT-04  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Login button in `src/app/app.html` uses structured span with responsive text class
- [x] Accessible `aria-label="Acessar ou cadastrar"` preserved
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): update toolbar template for responsive login CTA`  

---

#### T3: Refactor Toolbar SCSS for Mobile-First Spacing and Dark Glassmorphism

**What**: Update `src/app/app.scss` with mobile-first viewport padding (`8px` mobile, `16px` desktop), 48px touch target for login button, and dark glassmorphic styling.  
**Where**: `src/app/app.scss`  
**Depends on**: T2  
**Reuses**: `--org-glass-bg`, `--org-glass-blur`, `--org-primary`  
**Requirement**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Toolbar padding set to `0 8px` on mobile, scaling to `0 16px` on `min-width: 600px`
- [ ] Login CTA button has `min-height: 48px` and text does not overflow or clip on `< 480px`
- [ ] Dark theme glassmorphic styling verified
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): apply mobile-first styling and touch targets to app toolbar`  

---

### Phase 3: Event Editor Stepper & Form Responsiveness

#### T4: Refactor Event Editor Stepper Header and Container Padding

**What**: Update `src/app/features/admin/event-editor/event-editor.container.scss` for stepper header padding and smooth horizontal scroll without expanding document width.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.scss`  
**Depends on**: None  
**Reuses**: `src/app/features/admin/event-editor/event-editor.container.scss`  
**Requirement**: LAYOUT-05  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `.editor__stepper` header container padding set to `12px 8px` on mobile, scaling to `16px 24px` on `min-width: 600px`
- [ ] `.editor__form` padding adjusted to `24px 12px` on mobile, scaling to `40px 32px` on desktop
- [ ] Stepper header overflow does not trigger page-level horizontal scrollbar
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): make event editor stepper header and container responsive`  

---

#### T5: Refactor Event Editor Date/Time Row to Mobile-First Grid

**What**: Update `src/app/features/admin/event-editor/event-editor.container.scss` to define `.editor__date-time-row` as single-column (`1fr`) on mobile, expanding to `2fr 1fr` on `min-width: 600px`.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.scss`  
**Depends on**: T4  
**Reuses**: `src/app/features/admin/event-editor/event-editor.container.scss`  
**Requirement**: LAYOUT-06, LAYOUT-08  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `.editor__date-time-row` has base style `grid-template-columns: 1fr`
- [ ] `@media (min-width: 600px)` applies `grid-template-columns: 2fr 1fr`
- [ ] Date and Time inputs stack cleanly without truncation on mobile viewports
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): convert event editor date-time row to mobile-first grid`  

---

#### T6: Refactor Event Editor Address Rows to Mobile-First Grid

**What**: Update `src/app/features/admin/event-editor/event-editor.container.scss` to define `.editor__address-row-top` and `.editor__address-row` as single-column (`1fr`) on mobile, expanding to multi-column on `min-width: 600px`.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.scss`  
**Depends on**: T5  
**Reuses**: `src/app/features/admin/event-editor/event-editor.container.scss`  
**Requirement**: LAYOUT-07, LAYOUT-08  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `.editor__address-row-top` base style set to `grid-template-columns: 1fr`, expanding to `1fr 1fr` on `min-width: 600px`
- [ ] `.editor__address-row` base style set to `grid-template-columns: 1fr`, expanding to `2fr 1fr` on `min-width: 600px`
- [ ] Address fields fit within 100% width on 320px–480px viewports with zero clipping
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): convert event editor address rows to mobile-first grid`  

---

### Phase 4: Organizer Dashboard & Filter Chips Responsiveness

#### T7: Refactor Dashboard Filter Chips for Smooth Mobile Horizontal Scroll

**What**: Update `src/app/features/organizer/dashboard/components/event-filters/event-filters.component.scss` with smooth momentum scroll, `max-width: 100%`, and 48px minimum touch target height for filter chips.  
**Where**: `src/app/features/organizer/dashboard/components/event-filters/event-filters.component.scss`  
**Depends on**: None  
**Reuses**: `src/app/features/organizer/dashboard/components/event-filters/event-filters.component.scss`  
**Requirement**: LAYOUT-09, LAYOUT-12  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `.event-filters` has `overflow-x: auto`, `max-width: 100%`, `-webkit-overflow-scrolling: touch`, `scrollbar-width: none`
- [ ] `.event-filters__item` has `min-height: 48px` and comfortable touch padding
- [ ] Chips scroll horizontally without clipping chip text or border-radius on mobile
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): enable smooth horizontal scrolling and touch targets on filter chips`  

---

#### T8: Refactor Organizer Dashboard Layout for Mobile Cards and Desktop Table

**What**: Update `src/app/features/admin/dashboard/dashboard.container.scss` for clean mobile card metadata stacking, responsive header margins, and 48px touch targets on "Novo Evento" action.  
**Where**: `src/app/features/admin/dashboard/dashboard.container.scss`  
**Depends on**: T7  
**Reuses**: `src/app/features/admin/dashboard/dashboard.container.scss`  
**Requirement**: LAYOUT-10, LAYOUT-11, LAYOUT-12  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mobile view (`< 768px`) displays stacked event cards with full-width touch actions
- [ ] Desktop view (`>= 768px`) renders glassmorphic table with aligned columns
- [ ] "Novo Evento" button maintains `min-height: 48px`
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): enhance dashboard responsiveness for mobile cards and desktop table`  

---

### Phase 5: Profile & Family Roster Form Layout

#### T9: Refactor Profile Container SCSS for Mobile-First Lateral Padding

**What**: Update `src/app/features/profile/profile.container.scss` with fluid mobile padding (`16px 12px` on mobile, scaling to `32px 16px` on desktop).  
**Where**: `src/app/features/profile/profile.container.scss`  
**Depends on**: None  
**Reuses**: `src/app/features/profile/profile.container.scss`  
**Requirement**: LAYOUT-13  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Profile container has `padding: 16px 12px` on mobile, scaling to `32px 16px` on `min-width: 600px`
- [ ] Cards inside `/perfil` fit within 100% viewport width without horizontal overflow
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): apply mobile-first container padding to profile page`  

---

#### T10: Refactor Family Roster Manager for Mobile Stacking and 48px Touch Targets

**What**: Update `src/app/features/profile/components/family-roster-manager/family-roster-manager.component.scss` with 1-column input stacking on mobile (<640px), 3-column row on desktop, and 48px action buttons.  
**Where**: `src/app/features/profile/components/family-roster-manager/family-roster-manager.component.scss`  
**Depends on**: T9  
**Reuses**: `src/app/features/profile/components/family-roster-manager/family-roster-manager.component.scss`  
**Requirement**: LAYOUT-14, LAYOUT-15, LAYOUT-16  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `.family-roster__form-grid` uses `grid-template-columns: 1fr` on mobile, expanding to `2fr 1.5fr 1.5fr` on `min-width: 640px`
- [ ] `.family-roster__add-btn` and `.family-roster__remove-btn` satisfy `min-height: 48px` / touch target size
- [ ] Member card item text and badge wrap without clipping on 320px screens
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): convert family roster form to mobile-first grid with accessible touch targets`  

---

### Phase 6: Home & Event Detail Visual Alignment

#### T11: Refactor Home Event Cards Grid for Balanced Column Sizing

**What**: Update `src/app/features/home/home.container.scss` with `repeat(auto-fill, minmax(min(100%, 300px), 1fr))` grid and Plus Jakarta Sans typography tokens.  
**Where**: `src/app/features/home/home.container.scss`  
**Depends on**: None  
**Reuses**: `src/app/features/home/home.container.scss`  
**Requirement**: LAYOUT-17, LAYOUT-20  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Home grid uses `repeat(auto-fill, minmax(min(100%, 300px), 1fr))` preventing stretched single-card layouts
- [ ] Heading typography uses Plus Jakarta Sans font hierarchy (weight 800 display, 700 headlines)
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): balance home event card grid and typography tokens`  

---

#### T12: Refactor Event Detail Hero Banner and Padding for Mobile-First Layout

**What**: Update `src/app/features/event-detail/event-detail.container.scss` and `src/app/features/event-detail/components/event-card/event-card.component.scss` for fluid 16px lateral padding and responsive hero banner height.  
**Where**: `src/app/features/event-detail/event-detail.container.scss`  
**Depends on**: T11  
**Reuses**: `src/app/features/event-detail/event-detail.container.scss`  
**Requirement**: LAYOUT-18, LAYOUT-20  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Event detail container has `16px` padding on mobile, expanding to `24px` on desktop
- [ ] Hero banner renders with `border-radius: 20px` and responsive height (`240px` mobile, `300px` desktop)
- [ ] Date pill, location card, and RSVP button align cleanly without clipping
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): update event detail hero banner and responsive padding`  

---

#### T13: Refactor Guest Form Dialog for Mobile Glassmorphism Surface

**What**: Update `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.scss` for centered glassmorphism dialog surface (`border-radius: 28px`, `backdrop-filter: blur(24px)`).  
**Where**: `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.scss`  
**Depends on**: T12  
**Reuses**: `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.scss`  
**Requirement**: LAYOUT-19  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Dialog surface applies `border-radius: 28px` and glassmorphic backdrop blur
- [ ] Dialog padding adapts to mobile screens (`16px`) without content clipping
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(ui): style guest form dialog with glassmorphic surface and responsive padding`  

---

### Phase 7: Automated Visual Verification & Screenshot Refresh

#### T14: Implement Automated Overflow and Layout Spec Suite in Playwright

**What**: Update `e2e/specs/07-visual-layout.spec.ts` to assert `assertNoHorizontalOverflow` across all desktop and mobile views, and verify 48px touch targets on toolbar, chips, and buttons.  
**Where**: `e2e/specs/07-visual-layout.spec.ts`  
**Depends on**: None  
**Reuses**: `e2e/helpers/design-tokens.helper.ts`, `e2e/fixtures/test.fixture.ts`  
**Requirement**: LAYOUT-21, LAYOUT-22, LAYOUT-23  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `07-visual-layout.spec.ts` asserts `assertNoHorizontalOverflow` on Home, Login, Dashboard, Event Editor, Event Detail, and Profile views
- [ ] Asserts `assertMinTouchTarget` on primary CTA buttons and filter chips
- [ ] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): add automated horizontal overflow and touch target assertions to visual layout spec`  

---

#### T15: Refresh Visual Screenshot Baselines Across Desktop and Mobile Projects

**What**: Execute full Playwright E2E test suite across Desktop Chromium and Mobile Chrome projects, regenerating all 14+ screenshot baselines in `e2e/screenshots/`.  
**Where**: `e2e/screenshots/`  
**Depends on**: T14  
**Reuses**: `playwright.config.ts`, `e2e/fixtures/test.fixture.ts`  
**Requirement**: LAYOUT-21, LAYOUT-22, LAYOUT-23, LAYOUT-24  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] All 14+ baseline PNG screenshots in `e2e/screenshots/` regenerated with `-desktop` and `-mobile` suffixes
- [ ] `npm run test:e2e` passes 100% on both Desktop Chromium and Mobile Chrome projects with 0 errors
- [ ] Build gate passes: `npm run build && npm test -- --watch=false`

**Tests**: e2e  
**Gate**: build  
**Commit**: `test(e2e): refresh visual screenshot baselines for desktop and mobile viewports`  

---

## Phase Execution Map

Visual representation of task ordering. Phases run in sequence, and tasks within a phase run in order:

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

Phase 1:  T1
Phase 2:  T2 ------→ T3
Phase 3:  T4 ------→ T5 ------→ T6
Phase 4:  T7 ------→ T8
Phase 5:  T9 ------→ T10
Phase 6:  T11 -----→ T12 -----→ T13
Phase 7:  T14 -----→ T15
```

---

## Task Granularity Check

Before approving tasks, verify they are granular enough:

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Implement assertNoHorizontalOverflow Helper | 1 helper function | ✅ Granular |
| T2: Refactor Toolbar HTML for Responsive Login CTA | 1 template file | ✅ Granular |
| T3: Refactor Toolbar SCSS for Mobile-First Spacing | 1 stylesheet | ✅ Granular |
| T4: Refactor Event Editor Stepper Header Padding | 1 stylesheet | ✅ Granular |
| T5: Refactor Event Editor Date/Time Row Grid | 1 stylesheet | ✅ Granular |
| T6: Refactor Event Editor Address Rows Grid | 1 stylesheet | ✅ Granular |
| T7: Refactor Dashboard Filter Chips Horizontal Scroll | 1 stylesheet | ✅ Granular |
| T8: Refactor Organizer Dashboard Layout | 1 stylesheet | ✅ Granular |
| T9: Refactor Profile Container SCSS Padding | 1 stylesheet | ✅ Granular |
| T10: Refactor Family Roster Manager Form Grid | 1 stylesheet | ✅ Granular |
| T11: Refactor Home Event Cards Grid | 1 stylesheet | ✅ Granular |
| T12: Refactor Event Detail Hero Banner and Padding | 1 stylesheet | ✅ Granular |
| T13: Refactor Guest Form Dialog Glassmorphism Surface | 1 stylesheet | ✅ Granular |
| T14: Implement Automated Overflow and Layout Spec Suite | 1 test suite | ✅ Granular |
| T15: Refresh Visual Screenshot Baselines | 1 test execution & baselines | ✅ Granular |

---

## Diagram-Definition Cross-Check

Before approving tasks, verify the execution diagram is consistent with the task definitions:

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | T1 | ✅ Match |
| T2 | None | T2 | ✅ Match |
| T3 | T2 | T2 -> T3 | ✅ Match |
| T4 | None | T4 | ✅ Match |
| T5 | T4 | T4 -> T5 | ✅ Match |
| T6 | T5 | T5 -> T6 | ✅ Match |
| T7 | None | T7 | ✅ Match |
| T8 | T7 | T7 -> T8 | ✅ Match |
| T9 | None | T9 | ✅ Match |
| T10 | T9 | T9 -> T10 | ✅ Match |
| T11 | None | T11 | ✅ Match |
| T12 | T11 | T11 -> T12 | ✅ Match |
| T13 | T12 | T12 -> T13 | ✅ Match |
| T14 | None | T14 | ✅ Match |
| T15 | T14 | T14 -> T15 | ✅ Match |

---

## Test Co-location Validation

Before approving tasks, verify EVERY task's `Tests` field is consistent with the **Test Coverage Matrix** generated above:

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Implement assertNoHorizontalOverflow Helper | Test Helpers & Utilities | none | none | ✅ OK |
| T2: Refactor Toolbar HTML for Responsive Login CTA | Application Layout & Styles (HTML) | none | none | ✅ OK |
| T3: Refactor Toolbar SCSS for Mobile-First Spacing | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T4: Refactor Event Editor Stepper Header Padding | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T5: Refactor Event Editor Date/Time Row Grid | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T6: Refactor Event Editor Address Rows Grid | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T7: Refactor Dashboard Filter Chips Horizontal Scroll | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T8: Refactor Organizer Dashboard Layout | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T9: Refactor Profile Container SCSS Padding | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T10: Refactor Family Roster Manager Form Grid | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T11: Refactor Home Event Cards Grid | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T12: Refactor Event Detail Hero Banner and Padding | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T13: Refactor Guest Form Dialog Glassmorphism Surface | Application Layout & Styles (SCSS) | none | none | ✅ OK |
| T14: Implement Automated Overflow and Layout Spec Suite | Visual Regression & Overflow Spec | e2e | e2e | ✅ OK |
| T15: Refresh Visual Screenshot Baselines | Screenshot Baseline Suite | e2e | e2e | ✅ OK |
