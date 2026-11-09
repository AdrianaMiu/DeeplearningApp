import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const environment = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

test('published deployment exposes the configured tutor verification', async ({ page }) => {
  test.skip(!environment.PW_PRODUCTION_SMOKE, 'Run explicitly against the published GitHub Pages site.');

  await page.goto('https://adrianamiu.github.io/DeeplearningApp/#/lesson/tensor-shapes');
  await page.getByRole('button', { name: 'Open tutor' }).click();
  await page.getByLabel(/i understand/i).check();
  await page.getByRole('button', { name: /continue to tutor/i }).click();

  await expect(page.getByText(/tutor is not configured/i)).toHaveCount(0);
  const verification = page.getByLabel(/human verification/i);
  await expect(verification.locator('input[name="cf-turnstile-response"]')).toBeAttached({ timeout: 15_000 });
  await expect.poll(async () => (await verification.boundingBox())?.height ?? 0).toBeGreaterThan(0);
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
    await page.getByRole('link', { name: 'Lab Experiment with math', exact: true }).click();
    await page.getByLabel('Left shape').fill('4, 2');
    await page.getByLabel('Right shape').fill('4');
    await expect(page.getByText(/neither equal nor 1/i)).toBeVisible();
    await page.getByLabel('Right shape').fill('2');
    await expect(page.getByText(/compatible.*4, 2/i)).toBeVisible();
    await expect(page.getByRole('table', { name: /broadcasting axis compatibility/i })).toContainText('2');
  });

  test('persists a local note through reload', async ({ page }) => {
    await page.getByRole('link', { name: 'Notes Save your explanations', exact: true }).click();
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
    await page.getByRole('button', { name: 'Open tutor' }).click();
    await page.getByLabel(/i understand/i).check();
    await page.getByRole('button', { name: /continue to tutor/i }).click();
    await context.setOffline(true);
    if (environment.VITE_TUTOR_URL && environment.VITE_TURNSTILE_SITE_KEY) {
      await expect(page.getByLabel(/human verification/i)).toBeAttached();
      await expect(page.getByText(/tutor is not configured/i)).toHaveCount(0);
    } else {
      await expect(page.getByText(/tutor is not configured.*continue the lesson without ai/i)).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: /orient/i })).toBeVisible();
  });

  test('has no automatically detectable serious accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).exclude('.shape-sketch').analyze();
    expect(results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([]);
  });

  test('opens a non-foundation studio and its source map', async ({ page }) => {
    await page.getByRole('link', { name: 'Curriculum Explore the book', exact: true }).click();
    await page.getByRole('link', { name: 'Start studio: Convolutional Neural Networks' }).click();
    await expect(page).toHaveURL(/#\/lesson\/cnn-studio/);
    await page.goBack();
    await page.getByRole('link', { name: 'Inspect sections for Convolutional Neural Networks', exact: true }).click();
    await expect(page).toHaveURL(/#\/curriculum\/chapter-7/);
    await expect(page.getByRole('heading', { name: 'Source sections' })).toBeVisible();
    await expect(page.getByText('Individual exercise references', { exact: false })).toBeVisible();
  });

  test('Chapter 20 essential path preserves non-AI evidence and honest depth status', async ({ page }) => {
    await page.getByRole('link', { name: 'Curriculum Explore the book', exact: true }).click();
    const chapter = page.getByTestId('chapter-row').filter({ has: page.getByRole('heading', { name: /^Chapter 20:/ }) });
    await chapter.getByRole('link', { name: /inspect sections/i }).click();
    await expect(page).toHaveURL(/#\/curriculum\/chapter-20$/);
    const detail = page.locator('.chapter-detail');
    const path = detail.locator(':scope > ul').getByRole('link');
    await expect(path).toHaveText([
      'Separate two adversarial updates',
      'Trace a complete GAN training step',
      'Build and diagnose a DCGAN image path',
    ]);
    await expect(detail.getByText('Essential path complete', { exact: true })).toBeVisible();
    await expect(detail.getByText('0 of 14 detailed sections authored · 0 of 3 exercise activities authored.')).toBeVisible();
    await expect(detail.locator('.curriculum-chapter li .status')).toHaveText(Array(14).fill('Depth expansion planned'));
    await detail.getByText('Individual exercise references (3)', { exact: true }).click();
    await expect(detail.locator('.exercise-index li .status')).toHaveText(Array(3).fill('Depth expansion planned'));

    await path.nth(2).click();
    await expect(page.getByRole('heading', { name: 'Build and diagnose a DCGAN image path', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open tutor', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await page.goBack();
    await path.nth(1).click();
    await expect(page.getByRole('heading', { name: 'Trace a complete GAN training step', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'predict', exact: true }).click();
    await page.getByLabel('Your prediction').fill('Detach generated images during the discriminator update; preserve the input gradient during the generator update.');
    await page.getByRole('button', { name: 'Reveal worked example' }).click();
    await page.getByRole('button', { name: 'check', exact: true }).click();
    await page.getByRole('link', { name: 'Open quick practice' }).click();
    await expect(page).toHaveURL(/mode=quick&entry=gan-training-step$/);
    await page.getByRole('radio', { name: 'D receives gradients, while this fake branch sends no gradients into G', exact: true }).check();
    await page.getByRole('button', { name: 'Check answer', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Correct.');
    await page.getByRole('button', { name: 'Next question', exact: true }).click();
    await page.getByLabel('Your answer', { exact: true }).fill('0.308');
    await page.getByRole('button', { name: 'Check answer', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Correct.');
    await page.getByRole('button', { name: 'Next question', exact: true }).click();
    await page.getByRole('radio', { name: 'Use disjoint optimizers; detach fake images only for D; preserve the G-to-D gradient for G; compare both networks’ parameters around each phase.', exact: true }).check();
    await page.getByRole('button', { name: 'Check answer', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Correct.');
    await page.getByRole('link', { name: 'Progress Inspect your evidence', exact: true }).click();
    const evidence = page.locator('.progress-list article').filter({ has: page.getByRole('heading', { name: 'gradient boundary', exact: true }) });
    await expect(evidence).toContainText('3 independent evidence items');
    await page.reload();
    await expect(evidence).toContainText('3 independent evidence items');
    await expect(evidence).toContainText('demonstrated');
  });


  test('guides a studio through prediction, interaction, check and resume', async ({ page }) => {
    await page.goto('./#/lesson/modern-cnn-studio');
    await page.getByRole('button', { name: 'predict', exact: true }).click();
    await page.getByLabel('Your prediction').fill('The output becomes smaller.');
    await page.getByRole('button', { name: 'Reveal worked example' }).click();
    await expect(page.getByRole('region', { name: 'Worked example' })).toBeVisible();
    await page.getByRole('button', { name: 'try', exact: true }).click();
    await page.getByRole('button', { name: 'Both paths have the same shape' }).click();
    await expect(page.getByText('Matching shapes permit elementwise addition.')).toBeVisible();
    await page.getByRole('button', { name: 'check', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Open chapter check' })).toHaveAttribute('href', /mode=chapter&entry=modern-cnn-studio/);
    await page.getByRole('button', { name: 'Pause and save place' }).click();
    await expect(page.getByText(/saved locally/i)).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Check', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'predict', exact: true }).click();
    await expect(page.getByLabel('Your prediction')).toHaveValue('The output becomes smaller.');
  });

  test('uses the navigation drawer at a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const menu = page.getByRole('button', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await menu.click();
    await page.getByRole('link', { name: 'Curriculum Explore the book', exact: true }).click();
    await expect(page.getByRole('heading', { name: /the complete map/i })).toBeVisible();
  });
});

test.describe('Route accessibility and offline content', () => {
  for (const route of ['', 'curriculum', 'practice', 'review', 'lab', 'progress', 'notes', 'settings', 'lesson/modern-cnn-studio']) {
    test(`checks ${route || 'today'} at 320px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(`./#/${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  test('keyboard operates drawer, lesson tabs, previous stage and numeric control', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('./');
    const menu = page.getByRole('button', { name: 'Menu' });
    await menu.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Close navigation' })).toBeFocused();
    await page.keyboard.press('Escape'); await expect(menu).toBeFocused();
    await page.goto('./#/lesson/tensor-shapes');
    await page.getByRole('button', { name: 'predict', exact: true }).click();
    await page.getByLabel('Your prediction').fill('A vector remains.');
    await page.getByRole('button', { name: 'Reveal worked example' }).click();
    const intuition = page.getByRole('tab', { name: 'Intuition' });
    await intuition.focus(); await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Math' })).toBeFocused();
    await expect(page.getByRole('tab', { name: 'Math' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'Previous stage' }).focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Predict', exact: true })).toBeVisible();
    await page.goto('./#/lab');
    const range = page.locator('input[type="range"]').first();
    const previous = await range.inputValue(); await range.focus(); await page.keyboard.press('ArrowRight');
    expect(await range.inputValue()).not.toBe(previous);
  });

  test('serves a previously unvisited studio offline from the repository scope', async ({ page, context }) => {
    await page.goto('./');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(new URL(scope).pathname).toBe('/DeeplearningApp/');
    await context.setOffline(true);
    await page.goto('./#/lesson/modern-cnn-studio');
    await expect(page.getByRole('heading', { name: /compare modern CNN designs/i })).toBeVisible();
    await page.getByRole('button', { name: 'predict', exact: true }).click();
    await page.getByLabel('Your prediction').fill('The paths must have matching shapes.');
    await page.getByRole('button', { name: 'Reveal worked example' }).click();
    await page.getByRole('button', { name: 'try', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Both paths have the same shape' })).toBeVisible();
  });
});

