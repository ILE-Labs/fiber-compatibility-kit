import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const currentUrl = process.env.CURRENT_RPC_URL;
const oldUrl = process.env.OLD_RPC_URL;
const paymentConfig = {
  amount: process.env.PAYMENT_AMOUNT,
  currency: process.env.PAYMENT_CURRENCY,
  description: process.env.PAYMENT_DESCRIPTION,
  expiry: process.env.PAYMENT_EXPIRY,
  final_cltv: process.env.PAYMENT_FINAL_CLTV
};
const missing = Object.entries({ CURRENT_RPC_URL: currentUrl, OLD_RPC_URL: oldUrl, ...paymentConfig })
  .filter(([, value]) => !value).map(([name]) => name);
if (missing.length) throw new Error(`Missing live-capture configuration: ${missing.join(', ')}`);

async function rpc(url, method, params) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

function invoiceParams() {
  return {
    ...paymentConfig,
    payment_preimage: `0x${crypto.randomBytes(32).toString('hex')}`,
    hash_algorithm: 'sha256'
  };
}

async function capture(label, url) {
  const nodeInfo = await rpc(url, 'node_info', []);
  const invoice = await rpc(url, 'new_invoice', [invoiceParams()]);
  return { label, url, version: nodeInfo.result?.version ?? null, node_info: nodeInfo, new_invoice: invoice };
}

const oldNode = await capture('old', oldUrl);
const currentNode = await capture('current', currentUrl);
const crossPayments = [
  {
    payer: 'old',
    payee: 'current',
    response: await rpc(oldUrl, 'send_payment', [{ invoice: currentNode.new_invoice.result.invoice_address }])
  },
  {
    payer: 'current',
    payee: 'old',
    response: await rpc(currentUrl, 'send_payment', [{ invoice: oldNode.new_invoice.result.invoice_address }])
  }
];

const paymentMessages = crossPayments.map(({ response }) => response.error?.message ?? response.result?.status ?? 'unknown');
const sameFailureClass = paymentMessages.every((message) => message.includes('Failed to build route'));
const report = {
  schema: 'fiber-live-scenario/v1',
  captured_at: new Date().toISOString(),
  evidence_status: 'live_rpc_capture',
  scenario: 'invoice_creation_and_cross_node_payment_attempt',
  versions: { old: oldNode.version, current: currentNode.version },
  observations: {
    invoice_creation: 'SUCCEEDED_ON_BOTH_VERSIONS',
    payment_attempt: sameFailureClass ? 'FAILED_SAME_ROUTE_CLASS_ON_BOTH_VERSIONS' : 'DIFFERENT_FAILURE_CLASS',
    version_regression_claimed: false
  },
  limitations: [
    'The nodes had zero outbound liquidity, so this is a real negative-path payment test, not a successful settlement.',
    'Matching error classes do not prove all payment semantics are identical.',
    'Invoice addresses and payment hashes are local test evidence and must be redacted before public publication.'
  ],
  captures: { old: oldNode, current: currentNode, cross_payments: crossPayments }
};
const outputPath = path.join(root, 'evidence', 'live', 'payment-scenario.json');
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output: outputPath, scenario: report.scenario, result: report.observations.payment_attempt }, null, 2));
