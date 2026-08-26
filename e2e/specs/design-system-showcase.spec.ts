import { expect, test, type Page } from '@playwright/test';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';
import { assertMinTouchTarget, assertNoHorizontalOverflow } from '../helpers/design-tokens.helper';

const superAdmin = {
  uid: 'superadmin-uid',
  email: 'luiz.gmr.dev@gmail.com',
  displayName: 'Super Admin',
  isSuperAdmin: true,
};

interface SeasonalTokenExpectation {
  readonly label: string;
  readonly rootClass: string;
  readonly primary: string;
  readonly secondary: string;
  readonly tertiary: string;
  readonly gradientFragment: string;
  readonly canvasStart: string;
  readonly canvasEnd: string;
  readonly ringColor: string;
}

const seasonalTokenExpectations: readonly SeasonalTokenExpectation[] = [
  {
    label: 'Páscoa da Ressurreição',
    rootClass: 'theme-pascoa',
    primary: '#7552a8',
    secondary: '#d2a060',
    tertiary: '#f4d58e',
    gradientFragment: '#7552a8',
    canvasStart: '#faf6ff',
    canvasEnd: '#f9f3df',
    ringColor: 'rgba(109, 59, 167, 0.26)',
  },
  {
    label: 'Festa Junina',
    rootClass: 'theme-junina',
    primary: '#ff5722',
    secondary: '#ff8c42',
    tertiary: '#ffb300',
    gradientFragment: '#ff5722',
    canvasStart: '#fff6df',
    canvasEnd: '#e8f3ff',
    ringColor: 'rgba(255, 87, 34, 0.28)',
  },
  {
    label: 'Natal de Jesus',
    rootClass: 'theme-natal',
    primary: '#b84555',
    secondary: '#d77a61',
    tertiary: '#deb36a',
    gradientFragment: '#b84555',
    canvasStart: '#fff5f1',
    canvasEnd: '#eef8ef',
    ringColor: 'rgba(211, 47, 47, 0.28)',
  },
  {
    label: 'Ano Novo',
    rootClass: 'theme-ano-novo',
    primary: '#b88a33',
    secondary: '#ead9a5',
    tertiary: '#8293b5',
    gradientFragment: '#b88a33',
    canvasStart: '#fffbed',
    canvasEnd: '#edf1fa',
    ringColor: 'rgba(178, 122, 16, 0.28)',
  },
];

async function openShowcase(page: Page): Promise<void> {
  await setupMockAuthSession(page, superAdmin);
  await page.goto('/design-system');
  await expect(page.locator('.org-ds-topbar__title')).toBeVisible();
}

async function selectSeasonalTheme(page: Page, label: string): Promise<void> {
  const card = page.locator('.org-ds-season-card').filter({ hasText: label });
  await card.scrollIntoViewIfNeeded();
  await card.click();
}

test.describe('Design System Showcase', () => {
  test('redirects an unauthenticated visitor from the showcase', async ({ page }) => {
    await page.goto('/design-system');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects an authenticated non-superadmin visitor from the showcase', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'regular-user-uid',
      email: 'regular@organizaai.test',
      displayName: 'Regular User',
      isSuperAdmin: false,
    });

    await page.goto('/design-system');
    await expect(page).not.toHaveURL(/\/design-system$/);
  });

  test('renders every public component family as an anchored showcase section', async ({ page }) => {
    await openShowcase(page);

    const sectionIds = [
      'overview',
      'colors',
      'foundations',
      'typography',
      'iconography',
      'tokens',
      'components',
      'buttons',
      'inputs',
      'selection',
      'navigation',
      'stepper',
      'data-display',
      'feedback',
      'seasonal-themes',
    ];

    for (const id of sectionIds) {
      await expect(page.locator(`section#${id}`)).toBeAttached();
    }
  });

  test('keeps the anchored catalog within the mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openShowcase(page);
    await assertNoHorizontalOverflow(page);
  });

  test('documents the shared typography scale and Material Icons source', async ({ page }) => {
    await openShowcase(page);

    const typography = page.locator('section#typography');
    await expect(typography).toContainText('Plus Jakarta Sans');
    await expect(typography).toContainText('Fraunces');
    await expect(typography).toContainText('JetBrains Mono');
    await expect(typography).toContainText('Material Icons');
    await expect(typography.getByText('Uso recomendado')).toBeVisible();
  });

  test('keeps the shared navigation trigger at 48px or larger', async ({ page }) => {
    await openShowcase(page);
    await assertMinTouchTarget(page.getByRole('button', { name: 'Abrir menu de navegação' }));
  });

  test('groups the catalog and documents each layer with an exact Angular example', async ({ page }) => {
    await openShowcase(page);

    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();
    const drawer = page.getByTestId('navigation-drawer');
    await expect(drawer.getByRole('heading', { name: 'Marca', exact: true })).toBeVisible();
    await expect(drawer.getByRole('heading', { name: 'Fundações', exact: true })).toBeVisible();
    await expect(drawer.getByRole('heading', { name: 'Produto', exact: true })).toBeVisible();
    await expect(drawer.getByTestId('drawer-design-system-colors')).toHaveAttribute('href', '/design-system#colors');
    await expect(drawer.getByTestId('drawer-design-system-tokens')).toHaveAttribute('href', '/design-system#tokens');
    await page.getByTestId('navigation-drawer-close').click();

    for (const id of ['colors', 'typography', 'iconography', 'tokens', 'foundations']) {
      await expect(page.locator(`section#${id} app-design-system-code-example`)).toContainText('Uso recomendado');
    }

    const dataDisplay = page.locator('section#data-display');
    await expect(dataDisplay.locator('org-data-table')).toBeVisible();
    await expect(dataDisplay.locator('app-design-system-code-example')).toContainText('org-data-table');
  });

  test('applies each seasonal theme to the complete shared token contract', async ({ page }) => {
    await openShowcase(page);

    for (const theme of seasonalTokenExpectations) {
      await selectSeasonalTheme(page, theme.label);
      await expect(page.locator('html')).toHaveClass(new RegExp(theme.rootClass));

      const tokens = await page.locator('html').evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          primary: style.getPropertyValue('--org-primary').trim(),
          secondary: style.getPropertyValue('--org-secondary').trim(),
          tertiary: style.getPropertyValue('--org-tertiary').trim(),
          gradient: style.getPropertyValue('--org-gradient-primary').trim(),
          canvasStart: style.getPropertyValue('--org-canvas-start').trim(),
          canvasEnd: style.getPropertyValue('--org-canvas-end').trim(),
          ringColor: style.getPropertyValue('--org-glass-ring-color').trim(),
        };
      });

      expect(tokens.primary).toBe(theme.primary);
      expect(tokens.secondary).toBe(theme.secondary);
      expect(tokens.tertiary).toBe(theme.tertiary);
      expect(tokens.gradient).toContain(theme.gradientFragment);
      expect(tokens.canvasStart).toBe(theme.canvasStart);
      expect(tokens.canvasEnd).toBe(theme.canvasEnd);
      expect(tokens.ringColor).toBe(theme.ringColor);
    }
  });

  test('toggles the shared application color mode without leaving the route', async ({ page }) => {
    await openShowcase(page);
    const html = page.locator('html');
    const wasDark = await html.evaluate((element) => element.classList.contains('dark'));

    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();
    await page.getByTestId(wasDark ? 'drawer-theme-light' : 'drawer-theme-dark').click();

    if (wasDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }
  });

  test('uses a 24px glass blur and warm invitation treatment on showcase surfaces', async ({ page }) => {
    await openShowcase(page);

    const treatment = await page.locator('.org-ds-hero-card [data-testid="org-surface"]').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backdropFilter: style.backdropFilter,
        backgroundImage: style.backgroundImage,
      };
    });
    const buttonBackground = await page
      .locator('.org-ds-hero-card .org-button__control--gradient')
      .evaluate((element) => getComputedStyle(element).backgroundImage);

    expect(treatment.backdropFilter).toContain('blur(24px)');
    expect(treatment.backgroundImage).toContain('radial-gradient');
    expect(buttonBackground).toContain('linear-gradient');
  });

  test('preserves keyboard focus on an Angular Material field', async ({ page }) => {
    await openShowcase(page);

    const input = page.getByLabel('Título do evento');
    await input.focus();

    await expect(input).toBeFocused();
  });

  test('uses autocomplete when the catalog field has more than three options', async ({ page }) => {
    await openShowcase(page);
    const fields = page.locator('section#inputs');
    const input = fields.getByLabel('Categoria do evento');

    await expect(fields).toContainText('Até três opções, use Select. A partir de quatro, use Autocomplete.');
    await input.fill('corpor');
    await expect(page.getByRole('option', { name: 'Corporativo' })).toBeVisible();
    await page.getByRole('option', { name: 'Corporativo' }).click();

    await expect(input).toHaveValue('Corporativo');
  });
});
