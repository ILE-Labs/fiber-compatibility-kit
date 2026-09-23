# Compatibility Kit

An independent black-box tool for checking whether node RPC behavior remains
usable for SDKs, desktop applications, and payment integrations.

The project runs outside the node implementation. It compares pinned runtime
versions, records observable responses, identifies consumer-contract gaps, and
produces reproducible evidence without requiring an upstream merge.

## Current status

The first live capture is in [`evidence/live`](evidence/live). It exercised the
same `node_info` and pending-channel `list_channels` requests against versions
0.9.0 and 0.9.1 on the same local development chain.

The capture found that live channel responses contain `failure_detail`,
`is_acceptor`, `is_one_way`, and `pending_tlcs`, while the compared `fiber-js`
`Channel` type did not declare those fields. The exact SDK source revision must
be supplied when refreshing a live capture. This is a consumer contract gap,
not a claimed protocol regression.

## Run tests

```bash
npm ci
npm test
npm run validate:consumer
npm run classify:scenarios
```

## Try the tool

The repository includes a small user-facing inspection command. It runs against
the committed redacted fixture, so a new contributor can test the workflow
without running local nodes first:

```bash
npm run demo
```

The command prints the compared versions, observed channel state, consumer
fields, and the deliberately limited verdict. It does not claim a protocol
regression. The demo reads a committed recorded fixture; it is not pretending
to query a live node.

## Run the live negative-path scenario

With two RPC processes running on ports 21716 and 21714:

```bash
$env:CURRENT_RPC_URL="http://127.0.0.1:21714"
$env:OLD_RPC_URL="http://127.0.0.1:21716"
$env:PAYMENT_AMOUNT="0x1"
$env:PAYMENT_CURRENCY="Fibd"
$env:PAYMENT_DESCRIPTION="compatibility validation"
$env:PAYMENT_EXPIRY="0x64"
$env:PAYMENT_FINAL_CLTV="0x28"
npm run capture:payment
npm run sanitize:payment
```

This creates an invoice on each process and attempts a cross-node payment in
both directions. The current local setup has no outbound liquidity, so both
attempts are expected to return the same route failure. This is a real
negative-path comparison, not a successful-settlement claim.

The sanitizer preserves runtime-reported versions, available commit metadata,
invoice schema, and error classification while removing local URLs, invoice
addresses, public-key attributes, signatures, and payment hashes.

## Reproduce the consumer evidence

```bash
npm run validate:consumer
npm run classify:scenarios
```

The consumer validation reads the live channel fields through a downstream
adapter. CI repeats the checks using the committed redacted fixture, so no live
node is required for ordinary verification.

## Capture RPC evidence

```powershell
$env:CURRENT_RPC_URL="http://127.0.0.1:21714"
$env:OLD_RPC_URL="http://127.0.0.1:21716"
$env:FIBER_JS_CHANNEL_TS="C:\path\to\fiber-js\src\types\channel.ts"
python3 scripts/capture-live.py
$env:EXPECTED_CURRENT_VERSION="0.9.1"
$env:EXPECTED_OLD_VERSION="0.9.0"
python3 scripts/validate-evidence.py
```

All live endpoints, SDK paths, and expected version checks are supplied by the
operator. Raw responses remain local; only sanitized evidence should be
published.

## Generate a report from arbitrary captures

```bash
npm run compare -- captures/v0.9.0/funding-sign-failure.json captures/v0.9.1/funding-sign-failure.json artifacts/report.json
```

Synthetic reports remain marked `requires-real-run`. Live captures are marked
`live_rpc_capture` and include their observed keys and version metadata.
