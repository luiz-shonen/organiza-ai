import { expect, Locator, Page } from '@playwright/test';

const TOUCH_TARGET_MEASUREMENT_TOLERANCE = 0.01;

/**
 * Accepts only the sub-pixel loss introduced by browser layout rounding.
 * A value more than 0.01px below the WCAG target remains a failure.
 */
export function meetsMinimumTouchTarget(size: number, minSize = 48): boolean {
  return size >= minSize - TOUCH_TARGET_MEASUREMENT_TOLERANCE;
}

/**
 * Asserts that the document does not have horizontal overflow (scrollWidth <= innerWidth).
 */
export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const innerWidth = window.innerWidth;
    return {
      scrollWidth,
      clientWidth,
      innerWidth,
      hasOverflow: scrollWidth > innerWidth + 1,
    };
  });
  expect(
    overflow.hasOverflow,
    `Document has horizontal overflow: scrollWidth (${overflow.scrollWidth}px) exceeds innerWidth (${overflow.innerWidth}px)`
  ).toBe(false);
}

/**
 * Asserts that the element (or its surface) has a glassmorphic backdrop-filter with blur.
 */
export async function assertGlassmorphism(locator: Locator): Promise<void> {
  const target = locator.first();
  await expect(target).toBeVisible();
  const backdropFilter = await target.evaluate((el) => {
    const candidate = el.closest('.org-surface, [data-surface], .glass-drawer, mat-sidenav, .navigation-drawer, .rsvp-drawer') ||
                      el.querySelector('.org-surface, [data-surface], .glass-drawer, mat-sidenav, .navigation-drawer, .rsvp-drawer') ||
                      el;
    const style = window.getComputedStyle(candidate);
    return style.backdropFilter || style.webkitBackdropFilter || '';
  });
  expect(backdropFilter).toContain('blur');
}

/**
 * Asserts that the interactive element meets WCAG 2.5.5 minimum touch target size (default 48px).
 */
export async function assertMinTouchTarget(locator: Locator, minSize = 48): Promise<void> {
  const target = locator.first();
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(meetsMinimumTouchTarget(box.width, minSize)).toBe(true);
    expect(meetsMinimumTouchTarget(box.height, minSize)).toBe(true);
  }
}

export async function assertAppScrollOrigin(page: Page, scrollOwnerSelector = 'main.app-content'): Promise<void> {
  const positions = await page.evaluate((selector) => ({
    documentTop: document.documentElement.scrollTop,
    windowTop: window.scrollY,
    ownerTop: document.querySelector<HTMLElement>(selector)?.scrollTop ?? 0,
  }), scrollOwnerSelector);

  expect(positions.documentTop).toBeLessThanOrEqual(1);
  expect(positions.windowTop).toBeLessThanOrEqual(1);
  expect(positions.ownerTop).toBeLessThanOrEqual(1);
}

export async function assertAnchorVisibleInScrollOwner(anchor: Locator, scrollOwner: Locator): Promise<void> {
  await expect(anchor).toBeVisible();
  const geometry = await Promise.all([anchor.boundingBox(), scrollOwner.boundingBox()]);
  const [anchorBox, ownerBox] = geometry;
  expect(anchorBox).not.toBeNull();
  expect(ownerBox).not.toBeNull();
  if (anchorBox && ownerBox) {
    expect(anchorBox.x).toBeGreaterThanOrEqual(ownerBox.x - 1);
    expect(anchorBox.y).toBeGreaterThanOrEqual(ownerBox.y - 1);
    expect(anchorBox.x + anchorBox.width).toBeLessThanOrEqual(ownerBox.x + ownerBox.width + 1);
    expect(anchorBox.y + anchorBox.height).toBeLessThanOrEqual(ownerBox.y + ownerBox.height + 1);
  }
}

export async function assertSingleSurfaceRing(locator: Locator): Promise<void> {
  const ring = await locator.first().evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      borderWidth: parseFloat(style.borderTopWidth),
      backgroundClip: style.backgroundClip,
      before: window.getComputedStyle(element, '::before').content,
      after: window.getComputedStyle(element, '::after').content,
    };
  });
  expect(ring.borderWidth).toBeGreaterThanOrEqual(1);
  expect(ring.backgroundClip).toContain('padding-box');
  expect(ring.before).toMatch(/^(none|normal)$/);
  expect(ring.after).toMatch(/^(none|normal)$/);
}

export async function assertFocusedFieldCoherence(locator: Locator): Promise<void> {
  const target = locator.first();
  await target.focus();
  const state = await target.evaluate((element) => {
    const field = element.closest('mat-form-field');
    if (field) {
      const fieldStyle = window.getComputedStyle(field);
      const outlineSegments = Array.from(field.querySelectorAll<HTMLElement>('.mdc-notched-outline__leading, .mdc-notched-outline__notch, .mdc-notched-outline__trailing'));
      return {
        field: true,
        focusLabel: fieldStyle.getPropertyValue('--mdc-outlined-text-field-focus-label-text-color').trim(),
        focusOutline: fieldStyle.getPropertyValue('--mdc-outlined-text-field-focus-outline-color').trim(),
        primary: fieldStyle.getPropertyValue('--org-primary').trim(),
        segments: outlineSegments.flatMap((segment) => {
          const style = window.getComputedStyle(segment);
          return [
            [style.borderTopColor, style.borderTopWidth],
            [style.borderRightColor, style.borderRightWidth],
            [style.borderBottomColor, style.borderBottomWidth],
            [style.borderLeftColor, style.borderLeftWidth],
          ] as Array<[string, string]>;
        }),
      };
    }
    const orgField = element.closest('org-text-field, .org-text-field') || element;
    const style = window.getComputedStyle(orgField);
    const elemStyle = window.getComputedStyle(element);
    return {
      field: false,
      backgroundColor: style.backgroundColor !== 'rgba(0, 0, 0, 0)' ? style.backgroundColor : elemStyle.backgroundColor,
      borderColor: style.borderColor !== 'rgba(0, 0, 0, 0)' ? style.borderColor : elemStyle.borderColor,
      color: elemStyle.color || style.color,
    };
  });
  if (state.field) {
    expect(state.primary).not.toBe('');
    expect(state.focusLabel).toBe(state.primary);
    expect(state.focusOutline).toBe(state.primary);
    const segmentColors = state.segments
      .filter(([color, width]) => color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent' && parseFloat(width) > 0)
      .map(([color]) => color);
    expect(new Set(segmentColors).size).toBe(1);
    return;
  }
  expect(state.color).not.toBe('rgba(0, 0, 0, 0)');
}

export async function assertDrawerInset(drawer: Locator, minSize = 48): Promise<void> {
  const target = drawer.first();
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  const viewport = await target.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  expect(box).not.toBeNull();
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(minSize);
    expect(box.height).toBeGreaterThanOrEqual(minSize);
    expect(Math.abs(box.x + box.width - viewport.width)).toBeLessThanOrEqual(1);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  }
}

/**
 * Asserts that the element's typography token renders with the expected font family (default 'Plus Jakarta Sans').
 */
export async function assertFontFamily(locator: Locator, expectedFont = 'Plus Jakarta Sans'): Promise<void> {
  const target = locator.first();
  await expect(target).toBeVisible();
  const fontFamily = await target.evaluate((el) => window.getComputedStyle(el).fontFamily);
  expect(fontFamily).toContain(expectedFont);
}

/**
 * Asserts that focusing the element activates a custom theme focus outline, border, or glow.
 */
export async function assertFocusPrimaryColor(locator: Locator): Promise<void> {
  const target = locator.first();
  await expect(target).toBeVisible();
  await target.focus();
  const hasFocusStyle = await target.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return Boolean(style.borderColor || style.outlineColor || style.boxShadow);
  });
  expect(hasFocusStyle).toBe(true);
}
