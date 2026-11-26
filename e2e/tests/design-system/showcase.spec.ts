import { expect, test, type Page } from '@playwright/test';
import { setupMockAuthSession } from '../../helpers/auth-mock.helper';
import {
  assertMinTouchTarget,
  assertNoHorizontalOverflow,
} from '../../helpers/design-tokens.helper';

const superAdmin = {
  uid: 'superadmin-uid',
  email: 'luiz.gmr.dev@gmail.com',
  displayName: 'Super Admin',
  isSuperAdmin: true,
};

interface SeasonalTokenExpectation {
  readonly rootClass: string;
  readonly canvas: string;
}

// Seasonal themes only tint the canvas; the action, info and progress palette never changes.
const seasonalTokenExpectations: readonly SeasonalTokenExpectation[] = [
  { rootClass: 'theme-pascoa', canvas: '#faf6ff' },
  { rootClass: 'theme-junina', canvas: '#fff6df' },
  { rootClass: 'theme-natal', canvas: '#fff5f1' },
  { rootClass: 'theme-ano-novo', canvas: '#fffbed' },
];

async function openShowcase(page: Page): Promise<void> {
  await setupMockAuthSession(page, superAdmin);
  await page.goto('/design-system');
  await expect(
    page
      .getByTestId('design-system-page')
      .getByRole('heading', { level: 1, name: 'Design system' }),
  ).toBeVisible();
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

  test('renders every foundation and component family as an anchored section', async ({ page }) => {
    await openShowcase(page);

    for (const id of [
      'overview',
      'colors',
      'typography',
      'spacing',
      'iconography',
      'seasonal-themes',
      'layout',
      'buttons',
      'inputs',
      'selection',
      'navigation',
      'data-display',
      'feedback',
      'brand',
    ]) {
      await expect(page.locator(`section#${id}`)).toBeAttached();
    }
  });

  test('keeps the anchored catalog within the mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openShowcase(page);
    await assertNoHorizontalOverflow(page);
  });

  test('documents the type families and filters the typed Material icons', async ({ page }) => {
    await openShowcase(page);

    const typography = page.locator('section#typography');
    const iconography = page.locator('section#iconography');
    await expect(typography).toContainText('Plus Jakarta Sans');
    await expect(typography).toContainText('Fredoka');
    await expect(typography).toContainText('JetBrains Mono');
    await expect(typography.getByText('Uso recomendado')).toBeVisible();
    await expect(iconography).toContainText('Material Icons');

    await iconography.getByLabel('Nome do ícone').fill('delete');
    await expect(iconography.locator('.ds-icons__item')).toHaveCount(2);
  });

  test('keeps the shared navigation trigger at 48px or larger', async ({ page }) => {
    await openShowcase(page);
    await assertMinTouchTarget(page.getByRole('button', { name: 'Abrir menu de navegação' }));
  });

  test('groups the catalog and documents each component with an exact Angular example', async ({
    page,
  }) => {
    await openShowcase(page);

    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();
    const drawer = page.getByTestId('navigation-drawer');
    await expect(drawer.getByRole('heading', { name: 'Fundamentos', exact: true })).toBeVisible();
    await expect(drawer.getByRole('heading', { name: 'Componentes', exact: true })).toBeVisible();
    await expect(drawer.getByTestId('drawer-design-system-colors')).toHaveAttribute(
      'href',
      '/design-system#colors',
    );
    await expect(drawer.getByTestId('drawer-design-system-feedback')).toHaveAttribute(
      'href',
      '/design-system#feedback',
    );
    await page.getByTestId('navigation-drawer-close').click();

    for (const id of ['colors', 'typography', 'spacing', 'buttons', 'inputs', 'feedback']) {
      await expect(
        page.locator(`section#${id} app-design-system-code-example`).first(),
      ).toContainText('Uso recomendado');
    }

    const dataDisplay = page.locator('section#data-display');
    await expect(dataDisplay.locator('org-data-table')).toBeVisible();
    await expect(dataDisplay).toContainText('<org-data-table');
  });

  test('previews each seasonal theme without touching the shared palette', async ({ page }) => {
    await openShowcase(page);

    for (const theme of seasonalTokenExpectations) {
      const chip = page.getByTestId(`ds-season-${theme.rootClass}`);
      await chip.scrollIntoViewIfNeeded();
      await chip.click();
      await expect(page.locator('html')).toHaveClass(new RegExp(theme.rootClass));

      const tokens = await page.locator('html').evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          primary: style.getPropertyValue('--org-primary').trim(),
          secondary: style.getPropertyValue('--org-secondary').trim(),
          tertiary: style.getPropertyValue('--org-tertiary').trim(),
          canvas: style.getPropertyValue('--org-canvas').trim(),
          ringColor: style.getPropertyValue('--org-glass-ring-color').trim(),
        };
      });

      expect(tokens).toEqual({
        primary: '#7950f2',
        secondary: '#1c9bef',
        tertiary: '#2f9e44',
        canvas: theme.canvas,
        ringColor: '#ebe6f7',
      });
    }
  });

  test('shows the live value of each colour token and follows dark mode', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme_mode', 'light'));
    await openShowcase(page);
    const html = page.locator('html');
    const colors = page.locator('section#colors');
    const themes = page.locator('section#seasonal-themes');
    await expect(colors).toContainText('#7950f2');

    await themes.getByTestId('theme-dark-btn').click();
    await expect(html).toHaveClass(/dark/);
    await expect(colors).toContainText('#b197fc');

    await themes.getByTestId('theme-light-btn').click();
    await expect(html).not.toHaveClass(/dark/);
    await expect(page).toHaveURL(/\/design-system/);
  });

  test('uses flat surfaces and a solid lilac action on showcase cards', async ({ page }) => {
    await openShowcase(page);

    const card = page.locator('section#buttons [data-testid="org-surface"]').first();
    const backdropFilter = await card.evaluate(
      (element) => getComputedStyle(element).backdropFilter,
    );
    const buttonBackground = await page
      .locator('section#buttons .org-button__control--gradient')
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundImage);

    expect(backdropFilter).toBe('none');
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

    await expect(fields).toContainText(
      'Até três opções, use Select. A partir de quatro, use Autocomplete.',
    );
    await input.fill('confra');
    await expect(page.getByRole('option', { name: 'Confraternização' })).toBeVisible();
    await page.getByRole('option', { name: 'Confraternização' }).click();

    await expect(input).toHaveValue('Confraternização');
  });

  test('opens the confirmation dialog and the bottom sheet from their demos', async ({ page }) => {
    await openShowcase(page);
    const feedback = page.locator('section#feedback');

    await feedback.getByRole('button', { name: 'Cancelar evento' }).click();
    await page.getByRole('button', { name: 'Manter evento' }).click();
    await expect(feedback).toContainText('Resposta: manter o evento');

    await feedback.getByRole('button', { name: 'Eu levo' }).click();
    const sheet = page.getByRole('dialog', { name: 'Eu levo' });
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });
});
