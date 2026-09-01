import { expect, test } from '@playwright/test';
import config from '../../playwright.config';

test('stores visual comparisons under tracked scenario, theme, and viewport identities', () => {
  expect(config.snapshotPathTemplate).toBe(
    '{testDir}/snapshots/{testFilePath}/{projectName}/{arg}{ext}',
  );
  expect(config.expect?.toHaveScreenshot).toMatchObject({
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
  });
});
