import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const environment = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

test('published deployment exposes the configured tutor verification', async ({ page }) => {
  test.skip(!environment.PW_PRODUCTION_SMOKE, 'Run explicitly against the published GitHub Pages site.');

  await page.goto('https://adrianamiu.github.io/DeeplearningApp/#/lesson/tensor-shapes');
  await page.getByLabel(/i understand/i).check();
  await page.getByRole('button', { name: /continue to tutor/i }).click();

  await expect(page.getByText(/tutor is not configured/i)).toHaveCount(0);
  await expect(page.locator('[aria-label="Human verification"] iframe')).toBeVisible({ timeout: 15_000 });
});

test.describe('Deep Learning Companion release', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  test('loads production assets from the GitHub Pages repository base', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /your next clear step/i })).toBeVisible();
    const assetSources = await page.locator('script[src], link[rel="stylesheet"]').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute(node.tagName === 'SCRIPT' ? 'src' : 'href')),
    );
    expect(assetSources.filter(Boolean).every((source) => source!.startsWith('/DeeplearningApp/'))).toBe(true);
  });

  test('completes the broadcasting explorer with equivalent table output', async ({ page }) => {
    await page.getByRole('link', { name: 'Lab' }).click();
    await page.getByLabel('Left shape').fill('4, 2');
    await page.getByLabel('Right shape').fill('4');
    await expect(page.getByText(/neither equal nor 1/i)).toBeVisible();
    await page.getByLabel('Right shape').fill('2');
    await expect(page.getByText(/compatible.*4, 2/i)).toBeVisible();
    await expect(page.getByRole('table', { name: /broadcasting axis compatibility/i })).toContainText('2');
  });

  test('persists a local note through reload', async ({ page }) => {
    await page.getByRole('link', { name: 'Notes' }).click();
    await page.getByLabel('Note title').fill('Reload evidence');
    await page.getByLabel('Note body').fill('IndexedDB preserves this correction.');
    await page.getByRole('button', { name: 'Save note' }).click();
    await expect(page.getByText('Reload evidence')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Reload evidence')).toBeVisible();
  });

  test('supports keyboard-only navigation and visible focus', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /skip to content/i })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
    await page.keyboard.press('Tab');
    const focusedOutline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
    expect(focusedOutline).not.toBe('none');
  });

  test('honors reduced motion and keeps tutor failure non-blocking offline', async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const duration = await page.locator('.shape-sketch').evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(['0s', '0.00001s', '1e-05s']).toContain(duration);

    await page.getByRole('link', { name: /begin lesson/i }).click();
    await page.getByLabel(/i understand/i).check();
    await page.getByRole('button', { name: /continue to tutor/i }).click();
    await context.setOffline(true);
    if (environment.VITE_TUTOR_URL && environment.VITE_TURNSTILE_SITE_KEY) {
      await expect(page.getByLabel(/human verification/i)).toBeAttached();
      await expect(page.getByText(/tutor is not configured/i)).toHaveCount(0);
    } else {
      await expect(page.getByText(/tutor is not configured.*continue the lesson without ai/i)).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: /misconception check/i })).toBeVisible();
  });

  test('has no automatically detectable serious accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).exclude('.shape-sketch').analyze();
    expect(results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([]);
  });

  test('uses the navigation drawer at a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const menu = page.getByRole('button', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await menu.click();
    await page.getByRole('link', { name: 'Curriculum' }).click();
    await expect(page.getByRole('heading', { name: /the complete map/i })).toBeVisible();
  });
});
