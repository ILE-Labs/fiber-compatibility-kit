# Validation plan

## Scope

The merged funding-diagnostics change is treated as prior work. This repository
tests observable behavior from outside the node implementation; it does not
re-run internal unit tests as the deliverable.

## Required gates

1. Run the same scenarios against two real runtime versions.
2. Capture RPC and peer-visible output without modifying either version.
3. Produce machine-readable and human-readable evidence.
4. Demonstrate a consumer adapter for an SDK, desktop app, or checkout flow.
5. Explain why the external test catches contract drift rather than duplicating
   implementation tests.
6. Ask maintainers whether the artifact is useful only after the evidence is
   public.

## Current evidence matrix (2026-09-22)

| Gate | Status | Evidence |
|---|---|---|
| Real compatibility difference or failure | Partial/pass for contract gap; not a version regression | `evidence/live/report.json` shows four live channel fields absent from the checked-in type. The 0.9.0 and 0.9.1 payload key sets were otherwise identical in this scenario. |
| Useful to an existing consumer | Demonstrated at diagnostic level | The finding identifies fields a client cannot currently type or expose. Integration is not claimed. |
| Not a duplicate of internal tests | Strong evidence, not final acceptance | The capture launches compiled binaries and drives JSON-RPC externally. |
| Maintainer confirmation | Not met | No maintainer has reviewed or confirmed the artifact yet. |

This run proves that the method is real and found an actionable contract gap,
but it does not prove a protocol break between versions.

## Consumer artifact

The kit includes a downstream adapter in `src/consumer-channel.mjs`, a
TypeScript fixture in `fixtures/consumer/channel-response.ts`, and these
commands:

```bash
npm run validate:consumer
npm run classify:scenarios
```

They demonstrate that the observed fields can be consumed downstream and
classify the observed JSON shape without claiming semantic compatibility.

## Live payment scenario

The second live scenario creates an invoice on each version and attempts a
cross-node payment in both directions. The current local nodes have no
outbound liquidity, so both attempts return the same route failure. This is a
real negative-path observation, not a successful settlement claim.

```bash
npm run capture:payment
npm run sanitize:payment
```

A successful settlement requires funded, ready channels and remains optional.

## Gate status after the live run

| Gate | Status | Evidence |
|---|---|---|
| Real second scenario | Passed for a negative path | `evidence/live/payment-scenario.public.json` records invoice creation on 0.9.0 and 0.9.1 and the same route-failure class for both attempts. |
| Version difference | Not detected | The observed invoice and payment-failure behavior matched. |
| Consumer use case | Passed locally | `evidence/live/consumer-contract-report.json` uses four live channel fields through an adapter. |
| Reproducible CI | Passed locally | `npm ci`, `npm test`, consumer validation, scenario classification, and sanitization pass. |
| Public maintainer adoption | Open | The repository still needs to be published and reviewed by relevant maintainers. |

The next funding gate is adoption. If the gap is intentional, already covered,
or unwanted by downstream users, the funding proposal should stop.

## Stop conditions

- Both versions expose identical behavior and no contract needs testing.
- The harness only invokes existing internal tests.
- The result depends on source internals rather than observable behavior.
- No external consumer can use the output.
- Maintainers say the artifact has no value or is already covered.

## Evidence rules

Synthetic fixtures are only for testing the comparison engine. A real finding
must include the exact version/tag or commit, scenario command, node
configuration, redacted outputs, and reproduction instructions.
