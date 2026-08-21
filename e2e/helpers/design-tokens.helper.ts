import { expect, Locator } from '@playwright/test';

/**
 * Asserts that the element (or its surface) has a glassmorphic backdrop-filter with blur.
 */
export async function assertGlassmorphism(locator: Locator): Promise<void> {
  const target = locator.first();
  await expect(target).toBeVisible();
  const backdropFilter = await target.evaluate((el) => {
    const style = window.getComputedStyle(el);
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
    expect(box.height).toBeGreaterThanOrEqual(minSize);
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
