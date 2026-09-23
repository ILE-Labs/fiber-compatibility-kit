import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = path.join(root, 'evidence', 'live', 'payment-scenario.json');
const outputPath = path.join(root, 'evidence', 'live', 'payment-scenario.public.json');
const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const publicCapture = (capture) => ({
  label: capture.label,
  version: capture.version,
  url: '<local-rpc-redacted>',
  node_info: {
    version: capture.node_info?.result?.version ?? null,
    commit_hash: capture.node_info?.result?.commit_hash ?? null
  },
  new_invoice: {
    jsonrpc: capture.new_invoice?.jsonrpc ?? null,
    id: capture.new_invoice?.id ?? null,
    result: capture.new_invoice?.result ? {
      invoice: {
        currency: capture.new_invoice.result.invoice?.currency ?? null,
        amount: capture.new_invoice.result.invoice?.amount ?? null,
        attrs: (capture.new_invoice.result.invoice?.data?.attrs ?? []).filter(
          (attr) => !Object.prototype.hasOwnProperty.call(attr, 'payee_public_key')
        )
      }
    } : null
  }
});

const publicReport = {
  schema: raw.schema,
  captured_at: raw.captured_at,
  evidence_status: raw.evidence_status,
  scenario: raw.scenario,
  versions: raw.versions,
  observations: raw.observations,
  limitations: raw.limitations,
  captures: {
    old: publicCapture(raw.captures.old),
    current: publicCapture(raw.captures.current),
    cross_payments: raw.captures.cross_payments.map((item) => ({
      payer: item.payer,
      payee: item.payee,
      error_code: item.response?.error?.code ?? null,
      error_class: item.response?.error?.message?.split(':').slice(0, 2).join(':') ?? null
    }))
  }
};
fs.writeFileSync(outputPath, `${JSON.stringify(publicReport, null, 2)}\n`);
console.log(JSON.stringify({ output: outputPath, redacted: true }, null, 2));
