// @vitest-environment node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';
it('runs ingestion validation and lifecycle behavior against synthetic Python fixtures', async () => {
  const result = await promisify(execFile)('python3', ['-B', '-m', 'unittest', 'discover', '-s', 'tests/rag', '-p', '*_test.py']);
  expect(result.stderr).toContain('OK');
});
