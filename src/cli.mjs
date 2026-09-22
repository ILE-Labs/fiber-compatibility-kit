#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarizeChannel } from './consumer-channel.mjs';

function usage() {
  console.error('Usage: node src/cli.mjs inspect <responses.json>');
  process.exit(2);
}

const [, , command, input] = process.argv;
if (command !== 'inspect' || !input) usage();

const evidence = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
const endpoints = evidence.endpoints ?? {};
const versions = Object.fromEntries(Object.entries(endpoints).map(([label, value]) => [
  label,
  value.node_info?.result?.version ?? 'unknown'
]));
const channels = Object.entries(endpoints).flatMap(([label, value]) =>
  (value.list_channels_pending?.result?.channels ?? []).map((channel) => ({
    version: versions[label],
    ...summarizeChannel(channel)
  }))
);
const required = ['is_acceptor', 'is_one_way', 'pending_tlcs', 'failure_detail'];
const present = channels.length > 0 && required.every((field) => {
  const original = Object.values(endpoints).flatMap((value) => value.list_channels_pending?.result?.channels ?? []);
  return original.every((channel) => field in channel);
});

console.log('Compatibility Kit inspection');
console.log('=============================');
console.log('Evidence source: recorded redacted fixture');
console.log(`Versions: ${Object.values(versions).join(' vs ')}`);
console.log(`Scenario: pending channel response`);
console.log(`Consumer fields present: ${present ? 'YES' : 'NO'}`);
console.log(`Protocol regression claimed: NO`);
console.log(`Consumer contract result: ${present ? 'REVIEW_REQUIRED' : 'INCOMPLETE_EVIDENCE'}`);
console.log('');
console.log('Observed channels:');
for (const channel of channels) {
  console.log(`- ${channel.version} ${channel.channelId.slice(0, 18)}… | ${channel.state} | ${channel.role} | pending TLCs: ${channel.pendingTlcCount}`);
}

if (import.meta.url === `file://${fileURLToPath(import.meta.url)}`) {
  // The module is intentionally executable; no additional side effects are needed.
}
