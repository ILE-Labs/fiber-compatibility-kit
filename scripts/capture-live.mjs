import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const currentUrl = process.env.CURRENT_RPC_URL;
const oldUrl = process.env.OLD_RPC_URL;
if (!currentUrl || !oldUrl) throw new Error('Set CURRENT_RPC_URL and OLD_RPC_URL before a live capture');
const output = resolve(process.env.OUTPUT ?? "evidence/live");

async function rpc(url, method, params) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

function channelKeys(payload) {
  return [...new Set((payload?.result?.channels ?? []).flatMap((channel) => Object.keys(channel)))].sort();
}

const requests = {
  node_info: [],
  list_channels_pending: [{ pubkey: null, include_closed: false, only_pending: true }],
};

const evidence = { captured_at: new Date().toISOString(), endpoints: {} };
for (const [label, url] of [["current", currentUrl], ["old", oldUrl]]) {
  evidence.endpoints[label] = { url, responses: {} };
  for (const [name, params] of Object.entries(requests)) {
    evidence.endpoints[label].responses[name] = await rpc(url, name === "list_channels_pending" ? "list_channels" : name, params);
  }
}

const currentChannels = evidence.endpoints.current.responses.list_channels_pending;
const oldChannels = evidence.endpoints.old.responses.list_channels_pending;
const currentKeys = channelKeys(currentChannels);
const oldKeys = channelKeys(oldChannels);
const sdkChannelKeys = [
  "channel_id", "is_public", "channel_outpoint", "pubkey", "funding_udt_type_script",
  "state", "local_balance", "offered_tlc_balance", "remote_balance", "received_tlc_balance",
  "latest_commitment_transaction_hash", "created_at", "enabled", "tlc_expiry_delta",
  "tlc_fee_proportional_millionths", "shutdown_transaction_hash",
];
const observedKeys = [...new Set([...currentKeys, ...oldKeys])].sort();

evidence.analysis = {
  current_channel_keys: currentKeys,
  old_channel_keys: oldKeys,
  sdk_declared_channel_keys: sdkChannelKeys.sort(),
  live_keys_missing_from_fiber_js: observedKeys.filter((key) => !sdkChannelKeys.includes(key)),
  version_difference_detected: evidence.endpoints.current.responses.node_info.result?.version !== evidence.endpoints.old.responses.node_info.result?.version,
  evidence_status: "live_rpc_capture",
};

await mkdir(dirname(output), { recursive: true });
await writeFile(`${output}/responses.json`, `${JSON.stringify(evidence, null, 2)}\n`);
await writeFile(`${output}/report.json`, `${JSON.stringify(evidence.analysis, null, 2)}\n`);
console.log(JSON.stringify(evidence.analysis, null, 2));
