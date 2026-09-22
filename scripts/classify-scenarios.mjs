import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidencePath = process.env.EVIDENCE_FILE
  ? path.resolve(process.env.EVIDENCE_FILE)
  : path.join(root, 'evidence', 'live', 'responses.json');
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

function keys(value) { return Object.keys(value ?? {}).sort(); }
function classify(name, before, after) {
  const sameShape = JSON.stringify(keys(before)) === JSON.stringify(keys(after));
  return {
    scenario: name,
    before_version: evidence.endpoints.old.node_info.result.version,
    after_version: evidence.endpoints.current.node_info.result.version,
    shape_comparison: sameShape ? 'SAME_TOP_LEVEL_SHAPE' : 'SHAPE_DIFFERENCE',
    verdict: sameShape ? 'VERSION_COMPATIBLE' : 'VERSION_DIFFERENCE_REVIEW_REQUIRED',
    limitation: 'This classifies the observed JSON shape only; it does not prove semantic compatibility.'
  };
}

const report = {
  schema: 'fiber-scenario-matrix/v1',
  evidence_status: 'live_rpc_capture',
  scenarios: [
    classify('node_info', evidence.endpoints.old.node_info.result, evidence.endpoints.current.node_info.result),
    classify('list_channels_pending', evidence.endpoints.old.list_channels_pending.result, evidence.endpoints.current.list_channels_pending.result)
  ],
  sdk_finding: 'SDK_CONTRACT_GAP',
  version_regression_claimed: false
};
const outputPath = process.env.OUTPUT_FILE
  ? path.resolve(process.env.OUTPUT_FILE)
  : path.join(root, 'evidence', 'live', 'scenario-matrix.json');
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ scenarios: report.scenarios.length, output: outputPath }, null, 2));
