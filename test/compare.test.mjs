import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('detects an observable compatibility difference', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fiber-compat-'));
  const before = path.join(dir, 'before.json');
  const after = path.join(dir, 'after.json');
  const output = path.join(dir, 'report.json');
  fs.writeFileSync(before, JSON.stringify({ version: 'v0.9.0', scenario: 'funding-sign-failure', result: { local_failure_detail: null, peer_abort_message: 'Failed to sign funding transaction: root cause' } }));
  fs.writeFileSync(after, JSON.stringify({ version: 'v0.9.1', scenario: 'funding-sign-failure', result: { local_failure_detail: '[Channel x] SigningCommitment: root cause', peer_abort_message: 'Funding failed' } }));
  execFileSync(process.execPath, ['src/compare.mjs', before, after, output], { cwd: path.resolve(import.meta.dirname, '..') });
  const report = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.equal(report.verdict, 'DIFFERENCE_DETECTED');
  assert.ok(report.changes.some((item) => item.path.includes('peer_abort_message')));
  assert.equal(report.evidence_status, 'requires-real-run');
});
