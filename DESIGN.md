---
name: Vibrant Celebration
colors:
  surface: '#fef7ff'
  surface-dim: '#e4d3ff'
  surface-bright: '#fef7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f1ff'
  surface-container: '#f4eaff'
  surface-container-high: '#f0e3ff'
  surface-container-highest: '#ebddff'
  on-surface: '#231043'
  on-surface-variant: '#4a4455'
  inverse-surface: '#38265a'
  inverse-on-surface: '#f7edff'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#630ed4'
  on-primary: '#ffffff'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#d2bbff'
  secondary: '#a14000'
  on-secondary: '#ffffff'
  secondary-container: '#fd762b'
  on-secondary-container: '#5e2300'
  tertiary: '#733e53'
  on-tertiary: '#ffffff'
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

The palette is dominated by a royal **Deep Purple** for structure and authority, contrasted sharply by a **Vibrant Orange** for action and urgency. A **Soft Peach** serves as the bridge between these extremes, often used in gradients to create a festive "sunset" glow.

Backgrounds are never flat; they utilize a soft peach-to-lavender base layered with blurred, floating organic shapes in primary and secondary hues (20% opacity) to create a sense of living space behind the UI.

## Typography

This design system uses **Plus Jakarta Sans** across all roles to maintain a cohesive, rounded, and welcoming feel while ensuring legibility.

Headlines utilize the heaviest weights (Bold/ExtraBold) to achieve the "bubbly" festive look, often paired with tight letter spacing for a punchy, modern impact. Body text remains medium weight to ensure it holds its own against the vibrant, high-contrast backgrounds. All labels should be treated with uppercase styling and increased tracking when used for categorization.

## Layout & Spacing

The layout follows a **Fluid Grid** philosophy with generous margins to allow the background organic shapes to breathe.

- **Desktop:** 12-column grid, 64px outer margins, 24px gutters.
- **Mobile:** 4-column grid, 20px outer margins, 16px gutters.

Spacing follows an 8px rhythmic scale. Components should prioritize internal padding (`md` or 24px) to emphasize the "glass" container's surface area. Negative space is used aggressively around headlines to maintain the "Modern Festive" clarity.

## Elevation & Depth

Depth is achieved through **Glassmorphism** rather than traditional drop shadows.

1.  **Base Layer:** Soft gradient background with blurred organic blobs.
2.  **Surface Layer (Cards/Modals):** Translucent white (`rgba(255, 255, 255, 0.6)`) with a `backdrop-filter: blur(20px)`.
3.  **Borders:** A 1.5px solid border using a linear gradient (Purple to Orange) at 40% opacity.
4.  **Interactive Layer:** Primary buttons use a high-saturation gradient and a soft, colored glow shadow (`0px 10px 20px rgba(124, 58, 237, 0.3)`).

## Shapes

Shapes are unapologetically rounded to reinforce the "bubbly" and "friendly" brand vibe.

The standard radius for cards and major containers is `1rem` (Rounded). Smaller interactive elements like checkboxes or tags should use a fully pill-shaped (`rounded-xl`) radius. Avoid sharp corners entirely to maintain the organic, festive flow of the interface.

## Components

### Buttons

- **Primary:** Gradient fill (Deep Purple to Vibrant Orange), pill-shaped, white text, 1.5px inner glow border.
- **Secondary:** Glass-morphic fill, gradient border, purple text.
- **Interaction:** On hover, buttons should scale slightly (1.05x) and increase backdrop blur intensity.

### Cards

All cards must feature `backdrop-filter: blur(24px)` and a background color of `white` at 50-70% opacity. Borders must use the signature "Organiza" gradient (Purple/Pink/Orange).

### Inputs & Selection

- **Text Fields:** Soft peach background (10% opacity) with a 2px bottom border that animates into a full gradient border on focus.
- **Chips/Tags:** Pill-shaped with vibrant, semi-transparent fills. Each category should have a unique gradient-tinted background.
- **Checkboxes:** Circular (not square) to match the bubbly aesthetic, filling with the primary gradient when active.

### Lists

- Lists should be presented as floating glass tiles with `sm` (12px) vertical spacing between items, creating a "stacked glass" effect.
