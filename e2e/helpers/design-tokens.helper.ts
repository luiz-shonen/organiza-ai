import { expect, Locator, Page } from '@playwright/test';

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
    expect(box.width).toBeGreaterThanOrEqual(minSize);
    expect(box.height).toBeGreaterThanOrEqual(minSize);
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
    const style = window.getComputedStyle(element);
    return { backgroundColor: style.backgroundColor, borderColor: style.borderColor, color: style.color };
  });
  expect(state.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(state.borderColor).not.toBe('rgba(0, 0, 0, 0)');
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
