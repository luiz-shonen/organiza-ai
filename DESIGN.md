---
name: Vibrant Celebration
colors:
  surface: '#fff8f8'
  surface-dim: '#fce1ed'
  surface-bright: '#fff8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f1ff'
  surface-container: '#f4eaff'
  surface-container-high: '#f0e3ff'
  surface-container-highest: '#ebddff'
  on-surface: '#2a101f'
  on-surface-variant: '#4a4455'
  inverse-surface: '#38265a'
  inverse-on-surface: '#f7edff'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#ff4d94'
  on-primary: '#ffffff'
  primary-container: '#ff80b3'
  on-primary-container: '#3d001a'
  inverse-primary: '#ffc2d9'
  secondary: '#ff8c42'
  on-secondary: '#ffffff'
  secondary-container: '#ffb380'
  on-secondary-container: '#3d1400'
  tertiary: '#ffc837'
  on-tertiary: '#2a1f00'
  tertiary-container: '#8e556b'
  on-tertiary-container: '#ffdde7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#ffdbcc'
  secondary-fixed-dim: '#ffb694'
  on-secondary-fixed: '#351000'
  on-secondary-fixed-variant: '#7b2f00'
  tertiary-fixed: '#ffd9e4'
  tertiary-fixed-dim: '#f9b3cc'
  on-tertiary-fixed: '#360b1f'
  on-tertiary-fixed-variant: '#6a364b'
  background: '#fef7ff'
  on-background: '#231043'
  surface-variant: '#ebddff'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

The design system is built on a "Modern Festive Planner" narrative, designed to transform task management from a chore into a celebration. The target audience includes creative professionals, event planners, and individuals who thrive in high-energy, visually stimulating environments.

The aesthetic is a maximalist blend of **Glassmorphism** and **Vibrant Modernism**. It prioritizes depth through translucent layering, organic movement via background shapes, and a "bubbly" personality. Every interaction should feel energetic and high-fidelity, utilizing "Organiza-inspired" color transitions to guide the eye and evoke a sense of playfulness and momentum.

## Colors

The palette is led by the original vibrant **Pink**, **Orange**, and **Yellow** logo accents. A soft peach and blush surface palette lets these three hues create the festive gradient without turning the application into a purple product theme.

Backgrounds are never flat; they utilize a soft peach-to-lavender base layered with blurred, floating organic shapes in primary and secondary hues (20% opacity) to create a sense of living space behind the UI.

## Typography

This design system uses **Plus Jakarta Sans** across all roles to maintain a cohesive, rounded, and welcoming feel while ensuring legibility.

Headlines utilize the heaviest weights (Bold/ExtraBold) to achieve the "bubbly" festive look, often paired with tight letter spacing for a punchy, modern impact. Body text remains medium weight to ensure it holds its own against the vibrant, high-contrast backgrounds. All labels should be treated with uppercase styling and increased tracking when used for categorization.

## Layout & Spacing

The layout follows a **Fluid Grid & Mobile-First** philosophy with generous margins to allow the background organic shapes to breathe while guaranteeing zero horizontal overflow.

- **Desktop (≥ 600px / ≥ 960px):** 12-column grid, 32px-64px outer margins, 24px gutters.
- **Mobile (< 600px):** Single-column fluid stacking, 12px-16px outer margins, 12px-16px gutters.

### Mobile-First Responsive Rules (AD-031)

1. **Form Grid Stacking**: Multi-column form layouts (e.g. Date/Time rows, Address rows, Family Roster forms) must default to a single column (`grid-template-columns: 1fr`) on mobile viewports ($< 600\text{ px}$ / $< 640\text{ px}$) and expand to multi-column grids (`2fr 1fr`, `1fr 1fr`, or 3 columns) only on `@media (min-width: 600px)` or `@media (min-width: 640px)`.
2. **Container Padding Rhythm**: Component and page containers use fluid mobile-first padding:
   - Mobile: `16px 12px` (or `12px` on compact cards).
   - Desktop: `24px 16px` to `32px 16px`.
3. **Horizontal Scroll Containers**: Any component featuring horizontally sequenced items (e.g., Stepper headers, Filter chipsets) must declare:
   ```scss
   max-width: 100%;
   overflow-x: auto;
   flex-wrap: nowrap;
   -webkit-overflow-scrolling: touch;
   ```
4. **Zero Horizontal Overflow Invariant**: Every page view must maintain `document.documentElement.scrollWidth <= window.innerWidth + 1`. Unintended horizontal scrollbars on mobile viewports are strictly forbidden.

### Touch Target Standard (WCAG 2.5.5 AA)

All primary interactive controls must provide touch targets of $\ge 48\text{ px} \times 48\text{ px}$:
- Action buttons (`mat-flat-button`, `mat-stroked-button`, `mat-button`)
- Icon buttons (`mat-icon-button`, theme toggle, delete/remove buttons)
- Filter and status chips (`mat-chip-option`, `.filters__chip`)
- Modal trigger and close buttons

## Elevation & Depth

Depth is achieved through **Glassmorphism** rather than traditional drop shadows.

1.  **Base Layer:** Soft gradient background with blurred organic blobs.
2.  **Surface Layer (Cards/Modals):** Translucent white (`rgba(255, 255, 255, 0.6)`) with a `backdrop-filter: blur(24px)`.
3.  **Borders:** A 1.5px solid border using a linear gradient (Purple to Orange) at 40% opacity.
4.  **Interactive Layer:** Primary buttons use a high-saturation gradient and a soft, colored glow shadow (`0px 10px 20px rgba(124, 58, 237, 0.3)`).
5.  **Micro-interações e Celebração:** Textos de destaque (como o título do Login) utilizam a classe `.animated-gradient` para transicionar as cores do gradiente dinamicamente. Ações de sucesso significativas (confirmação de RSVP, itens assumidos) disparam chuvas de confetes através do `ConfettiService` integrado com `canvas-confetti`.

## Shapes

Shapes are unapologetically rounded to reinforce the "bubbly" and "friendly" brand vibe.

The standard radius for cards and major containers is `1rem` (Rounded) to `1.5rem` (`24px`). Dialogs and hero banners use `20px` to `28px` border radius. Smaller interactive elements like checkboxes or tags should use a fully pill-shaped (`rounded-xl`) radius. Avoid sharp corners entirely to maintain the organic, festive flow of the interface.

## Components

### Buttons

- **Primary:** Gradient fill (Deep Purple to Vibrant Orange), pill-shaped, white text, 1.5px inner glow border, min-height 48px.
- **Secondary:** Glass-morphic fill, gradient border, purple text, min-height 48px.
- **Icon Buttons:** Centered, minimum dimension $48\text{ px} \times 48\text{ px}$.
- **Interaction:** On hover, buttons should scale slightly (1.05x) and increase backdrop blur intensity.

### Cards

All cards must feature `backdrop-filter: blur(24px)` and a background color of `white` at 50-70% opacity. Borders must use the signature "Organiza" gradient (Purple/Pink/Orange). Padding adapts responsively from `12px-16px` on mobile to `24px` on desktop.

### Hero Banners (Event Detail)

- **Mobile:** Height $240\text{ px}$, `border-radius: 20px`.
- **Desktop:** Height $300\text{ px}$, `border-radius: 24px`.
- Linear gradient overlay ensures title contrast over custom imagery.

### Inputs & Selection

- **Text Fields:** Soft peach background (10% opacity) with Material 3 MDC outline tokens (`--mdc-outlined-text-field-*`) transitioning to `--org-primary` on focus.
- **Chips/Tags:** Pill-shaped with vibrant, semi-transparent fills (`min-height: 48px` on touch targets), horizontal scroll with `flex-shrink: 0`.
- **Checkboxes:** Circular (not square) to match the bubbly aesthetic, filling with the primary gradient when active.

### Lists

- Lists should be presented as floating glass tiles with `sm` (12px) vertical spacing between items, creating a "stacked glass" effect.

### Modals & Dialogs

- **ConfirmDialogComponent:** Generic confirmation dialog for cancellations and deletions, encapsulating action buttons and glassmorphic styling.
- **GuestFormDialogComponent:** RSVP submission dialog with fluid padding, responsive title, and $\ge 48\text{ px}$ touch target actions.
- **CollaboratorInviteDialogComponent:** Signal-driven collaborator management dialog with inline validation, reactive invite emissions, and mobile-friendly chip set.
