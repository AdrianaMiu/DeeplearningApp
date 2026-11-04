// Rebuild the server's companion-authored snapshot without copying book text.
import { build } from 'esbuild';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'd2l-context-'));
try {
  const outfile = join(directory, 'studios.mjs');
  await build({ entryPoints: [join(root, 'src/content/studios/index.ts')], outfile, bundle: true, platform: 'node', format: 'esm' });
  const { chapterStudios } = await import(pathToFileURL(outfile));
  const contexts = Object.fromEntries(chapterStudios.map(studio => [studio.id, {
    lessonId: studio.id, conceptIds: studio.conceptIds,
    summary: [studio.views.intuition, studio.views.math, studio.workedExample, ...studio.misconceptions].join(' '),
    sourceRefs: studio.sourceRefs.map(({ sectionId, printedStart, pdfPageStart }) => ({ sectionId, printedStart, pdfPageStart })),
  }]));
  await writeFile(join(root, 'worker/src/studio-contexts.json'), JSON.stringify(contexts, null, 2) + '\n');
} finally { await rm(directory, { recursive: true, force: true }); }
