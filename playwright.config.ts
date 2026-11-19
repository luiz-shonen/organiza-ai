import { defineConfig, devices } from '@playwright/test';

/**
 * E2E_DEMO=1 swaps the projects for the slowed-down, recorded "demo" ones, so a human can
 * follow each click in the video. The normal run (chromium, mobile-chrome) stays fast and
 * records nothing. scripts/e2e-changed-videos.mjs sets it; see docs/knowledge/decisions/testing.md.
 */
const demo = !!process.env['E2E_DEMO'];
const slowMo = Number(process.env['E2E_DEMO_SLOWMO'] ?? 500);

const desktopDemo = { width: 1280, height: 800 };
const mobileDemo = devices['Pixel 5'].viewport;

const recorded = (size: { width: number; height: number }) => ({
  viewport: size,
  // Highlight each click and fill, and show the test title and current step on screen.
  video: {
    mode: 'on' as const,
    size,
    show: {
      actions: { duration: 800, position: 'bottom-right' as const, cursor: 'pointer' as const },
      test: { level: 'step' as const, position: 'top' as const },
    },
  },
  launchOptions: { slowMo },
  trace: 'off' as const,
  screenshot: 'off' as const,
});

export default defineConfig({
  testDir: './e2e/tests',
  timeout: (demo ? 5 * 60 : 45) * 1000,
  expect: {
    timeout: (demo ? 30 : 10) * 1000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  snapshotPathTemplate: '{testDir}/snapshots/{testFilePath}/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] && !demo ? 2 : 0,
  workers: 2,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4200',
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: demo
    ? [
        {
          name: 'demo',
          outputDir: 'test-results/demo',
          ignoreSnapshots: true,
          use: { ...devices['Desktop Chrome'], ...recorded(desktopDemo) },
        },
        {
          name: 'demo-mobile',
          outputDir: 'test-results/demo-mobile',
          ignoreSnapshots: true,
          use: { ...devices['Pixel 5'], ...recorded(mobileDemo) },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'mobile-chrome',
          use: { ...devices['Pixel 5'] },
        },
      ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000,
  },
});
