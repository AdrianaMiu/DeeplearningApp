// @vitest-environment node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';
it('validates source regeneration and release boundaries with synthetic Python fixtures', async () => {
  const result = await promisify(execFile)('python3', ['-B', '-m', 'unittest', 'discover', '-s', 'tests/scripts', '-p', '*_test.py']);
  expect(result.stderr).toContain('OK');
});
