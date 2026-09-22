import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

test('demo CLI produces a consumer-facing verdict', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const output = execFileSync(process.execPath, [
    'src/cli.mjs', 'inspect', 'evidence/live/responses.public.json'
  ], { cwd: root, encoding: 'utf8' });
  assert.match(output, /Consumer contract result: REVIEW_REQUIRED/);
  assert.match(output, /Protocol regression claimed: NO/);
  assert.match(output, /Versions: 0\.9\.1 vs 0\.9\.0/);
});
