import fs from 'node:fs';
import path from 'node:path';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, normalize(v)]));
  }
  return value;
}

function diff(a, b, prefix = '') {
  const changes = [];
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  for (const key of [...keys].sort()) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (!(key in (a ?? {}))) changes.push({ path: p, kind: 'added', before: undefined, after: b[key] });
    else if (!(key in (b ?? {}))) changes.push({ path: p, kind: 'removed', before: a[key], after: undefined });
    else if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
      if (a[key] && b[key] && typeof a[key] === 'object' && typeof b[key] === 'object' && !Array.isArray(a[key]) && !Array.isArray(b[key])) changes.push(...diff(a[key], b[key], p));
      else changes.push({ path: p, kind: 'changed', before: a[key], after: b[key] });
    }
  }
  return changes;
}

function main() {
  const [, , beforeFile, afterFile, outputFile = 'artifacts/compatibility-report.json'] = process.argv;
  if (!beforeFile || !afterFile) throw new Error('Usage: npm run compare -- <before.json> <after.json> [output.json]');
  const before = normalize(readJson(beforeFile));
  const after = normalize(readJson(afterFile));
  const changes = diff(before, after);
  const report = {
    schema: 'fiber-compatibility-report/v1',
    generated_at: new Date().toISOString(),
    before: before.version ?? 'unknown',
    after: after.version ?? 'unknown',
    source: { before: before.source ?? null, after: after.source ?? null },
    scenario: before.scenario ?? after.scenario ?? 'unknown',
    changes,
    verdict: changes.length ? 'DIFFERENCE_DETECTED' : 'NO_DIFFERENCE_DETECTED',
    evidence_status: 'requires-real-run',
    limitations: [
      'A snapshot difference is not automatically a regression.',
      'This report becomes evidence only when both snapshots come from real Fiber versions and a reproducible scenario.',
      'The harness does not infer maintainer intent.'
    ]
  };
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ verdict: report.verdict, changes: changes.length, output: outputFile }, null, 2));
}

main();
