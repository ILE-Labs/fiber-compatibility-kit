import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarizeChannel } from '../src/consumer-channel.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidencePath = process.env.EVIDENCE_FILE
  ? path.resolve(process.env.EVIDENCE_FILE)
  : path.join(root, 'evidence', 'live', 'responses.json');
const outputPath = path.join(root, 'evidence', 'live', 'consumer-contract-report.json');
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const required = ['is_acceptor', 'is_one_way', 'pending_tlcs', 'failure_detail'];
const channels = [
  ...evidence.endpoints.current.list_channels_pending.result.channels,
  ...evidence.endpoints.old.list_channels_pending.result.channels
];
const missing = channels.flatMap((channel) => required.filter((key) => !(key in channel)));
if (missing.length) throw new Error(`live consumer fixture missing fields: ${missing.join(', ')}`);

const summaries = channels.map(summarizeChannel);
const report = {
  schema: 'fiber-consumer-contract/v1',
  evidence_status: 'live_rpc_capture',
  versions: [evidence.endpoints.old.node_info.result.version, evidence.endpoints.current.node_info.result.version],
  scenario: 'list_channels_pending',
  fields_consumed: required,
  result: 'CONSUMER_CONTRACT_SUPPORTED',
  summaries
};
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ result: report.result, output: outputPath, channels: summaries.length }, null, 2));
