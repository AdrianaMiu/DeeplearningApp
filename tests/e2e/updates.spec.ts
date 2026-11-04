import { expect, test } from '@playwright/test';
// Playwright executes this fixture in Node; the app tsconfig excludes Node types.
// @ts-expect-error Node types are intentionally absent from the app tsconfig.
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
// @ts-expect-error Node types are intentionally absent from the app tsconfig.
import { execFileSync } from 'node:child_process';
// @ts-expect-error Node types are intentionally absent from the app tsconfig.
import { createServer } from 'node:http';
// @ts-expect-error Node types are intentionally absent from the app tsconfig.
import { tmpdir } from 'node:os';
// @ts-expect-error Node types are intentionally absent from the app tsconfig.
import { join, extname } from 'node:path';
// @ts-expect-error Node types are intentionally absent from the app tsconfig.
import process from 'node:process';

test('keeps both revision A tabs safe until they close, then serves revision B offline', async ({ context }) => {
  test.setTimeout(120_000);
  const root = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'companion-update-'));
  const a = join(temp, 'a'); const b = join(temp, 'b');
  const config = join(root, `.update-test-${Date.now()}.config.ts`);
  const vite = join(root, 'node_modules/vite/bin/vite.js');
  let current = a;
  // This creates two genuine production bundles; only a studio title differs.
  writeFileSync(config, `import config from ${JSON.stringify(join(root, 'vite.config.ts'))};\nexport default { ...config, plugins: [...config.plugins, { name: 'revision-b', enforce: 'pre', transform(code, id) { if (id.endsWith('/src/content/studios/vision.ts')) return code.replace('Compare modern CNN designs', 'Compare modern CNN designs revision B'); } }] };`);
  const server = createServer((request: { url?: string }, response: { writeHead: (status: number, headers?: Record<string, string>) => void; end: (data?: unknown) => void }) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    if (pathname === '/') { response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' }); response.end('<title>Outside scope</title>'); return; }
    const relative = pathname.replace(/^\/DeeplearningApp\//, '');
    if (relative.includes('..') || !pathname.startsWith('/DeeplearningApp/')) { response.writeHead(404); response.end(); return; }
    const file = join(current, relative || 'index.html');
    if (!existsSync(file)) { response.writeHead(404); response.end(); return; }
    const mime: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ipynb': 'application/json' };
    response.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    response.end(readFileSync(file));
  });
  try {
    execFileSync('node', [vite, 'build', '--outDir', a], { cwd: root, stdio: 'pipe' });
    execFileSync('node', [vite, 'build', '--config', config, '--outDir', b], { cwd: root, stdio: 'pipe' });
    const lessonChunk = (dir: string) => readdirSync(join(dir, 'assets')).find((name: string) => /^lessons-.*\.js$/.test(name));
    expect(lessonChunk(a)).toBeTruthy(); expect(lessonChunk(b)).not.toBe(lessonChunk(a));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const first = await context.newPage();
    await first.goto(`${origin}/DeeplearningApp/#/notes`);
    await first.evaluate(async () => { await navigator.serviceWorker.ready; });
    await first.reload();
    await expect.poll(() => first.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await first.getByLabel('Note title').fill('Unsaved title');
    await first.getByLabel('Note body').fill('Keep this draft in the first tab.');
    const second = await context.newPage();
    await second.goto(`${origin}/DeeplearningApp/#/notes`);
    await second.getByLabel('Note body').fill('Keep this second draft.');
    current = b;
    await first.evaluate(async () => { const registration = await navigator.serviceWorker.ready; await registration.update(); });
    await expect.poll(() => first.evaluate(async () => Boolean((await navigator.serviceWorker.ready).waiting))).toBe(true);
    await expect(first.getByRole('status').filter({ hasText: /update is ready/i })).toBeVisible();
    await expect(second.getByRole('status').filter({ hasText: /update is ready/i })).toBeVisible();
    await expect(first.getByLabel('Note body')).toHaveValue('Keep this draft in the first tab.');
    await expect(second.getByLabel('Note body')).toHaveValue('Keep this second draft.');
    const oldStudio = await context.newPage();
    await oldStudio.goto(`${origin}/DeeplearningApp/`);
    await context.setOffline(true);
    await oldStudio.goto(`${origin}/DeeplearningApp/#/lesson/modern-cnn-studio`);
    await expect(oldStudio.getByRole('heading', { name: 'Compare modern CNN designs', exact: true })).toBeVisible();
    await oldStudio.getByRole('button', { name: 'predict', exact: true }).click();
    await oldStudio.getByLabel('Your prediction').fill('The paths must match.');
    await oldStudio.getByRole('button', { name: 'Reveal worked example' }).click();
    await oldStudio.getByRole('button', { name: 'try', exact: true }).click();
    await expect(oldStudio.getByRole('button', { name: 'Both paths have the same shape' })).toBeVisible();
    await context.setOffline(false); await oldStudio.close();
    const observer = await context.newPage(); await observer.goto(`${origin}/`);
    await first.close();
    await expect(second.getByLabel('Note body')).toHaveValue('Keep this second draft.');
    expect(await second.evaluate(async () => Boolean((await navigator.serviceWorker.ready).waiting))).toBe(true);
    await second.close();
    await expect.poll(() => observer.evaluate(async (scope) => { const r = await navigator.serviceWorker.getRegistration(scope); return Boolean(r && !r.waiting && r.active); }, `${origin}/DeeplearningApp/`), { timeout: 15_000 }).toBe(true);
    await observer.goto(`${origin}/DeeplearningApp/`);
    await context.setOffline(true);
    await observer.goto(`${origin}/DeeplearningApp/#/lesson/modern-cnn-studio`);
    await expect(observer.getByRole('heading', { name: 'Compare modern CNN designs revision B' })).toBeVisible();
    await observer.getByRole('button', { name: 'predict', exact: true }).click();
    await observer.getByLabel('Your prediction').fill('The paths must match.');
    await observer.getByRole('button', { name: 'Reveal worked example' }).click();
    await observer.getByRole('button', { name: 'try', exact: true }).click();
    await expect(observer.getByRole('button', { name: 'Both paths have the same shape' })).toBeVisible();
  } finally {
    await context.setOffline(false);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(config, { force: true }); rmSync(temp, { recursive: true, force: true });
  }
});
