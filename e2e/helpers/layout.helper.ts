import { expect, Locator, Page } from '@playwright/test';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Bounding box of a visible element; fails the test with a clear message when it has none. */
export async function getBoundingBox(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`Expected a bounding box for ${locator}, but the element is not rendered.`);
  }
  return box;
}

/** The element sits inside the viewport with at least `gutter` px on each side. */
export async function assertWithinViewport(
  page: Page,
  locator: Locator,
  gutter = 0,
): Promise<void> {
  const box = await getBoundingBox(locator);
  const viewportWidth = page.viewportSize()?.width ?? 0;
  expect(box.x).toBeGreaterThanOrEqual(gutter);
  expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth - gutter + (gutter === 0 ? 1 : 0));
}

interface StepperLayoutExpectation {
  isMobile: boolean;
  step: number;
  label: string;
}

/**
 * Below 600px the editor hides the Material step header and shows a compact
 * "Etapa N de 3" progress; above it the header scrolls horizontally.
 */
export async function assertStepperLayout(
  page: Page,
  { isMobile, step, label }: StepperLayoutExpectation,
): Promise<void> {
  const stepperHeader = page.locator('.mat-horizontal-stepper-header-container');
  const stepProgress = page.getByTestId('event-step-progress');

  if (isMobile) {
    await expect(stepProgress).toBeVisible();
    await expect(stepProgress).toContainText(`Etapa ${step} de 3`);
    await expect(stepProgress).toContainText(label);
    await expect(stepProgress.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      String(step),
    );
    await expect(stepperHeader).toHaveCSS('display', 'none');
    return;
  }

  await expect(stepperHeader).toHaveCSS('overflow-x', 'auto');
  await expect(stepperHeader).toHaveCSS('flex-wrap', 'nowrap');
  const activeHeader = page.locator('.mat-step-header[aria-selected="true"]');
  await expect(activeHeader).toBeVisible();
  await assertWithinViewport(page, activeHeader);
}

/** Inline gap between a surface and a field inside it: 12px on mobile, 16px from tablet up. */
export async function assertInlineInset(
  surface: Locator,
  field: Locator,
  isMobile: boolean,
): Promise<void> {
  const expectedInset = isMobile ? 12 : 16;
  const surfaceBox = await getBoundingBox(surface);
  const fieldBox = await getBoundingBox(field);
  const leftInset = fieldBox.x - surfaceBox.x;
  const rightInset = surfaceBox.x + surfaceBox.width - (fieldBox.x + fieldBox.width);
  expect(leftInset).toBeGreaterThanOrEqual(expectedInset - 2);
  expect(leftInset).toBeLessThanOrEqual(expectedInset + 6);
  expect(rightInset).toBeGreaterThanOrEqual(expectedInset - 2);
  expect(rightInset).toBeLessThanOrEqual(expectedInset + 6);
}

/** Vertical padding of a surface: 16px on mobile, 24px from tablet up. */
export async function assertSurfaceBlockPadding(
  surface: Locator,
  isMobile: boolean,
): Promise<void> {
  const minimum = isMobile ? 16 : 24;
  const padding = await surface.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { top: parseInt(style.paddingTop, 10), bottom: parseInt(style.paddingBottom, 10) };
  });
  expect(padding.top).toBeGreaterThanOrEqual(minimum);
  expect(padding.bottom).toBeGreaterThanOrEqual(minimum);
}
