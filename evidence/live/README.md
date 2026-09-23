# Live evidence: versions 0.9.0 and 0.9.1

Captured on 2026-09-22 from two separately compiled node processes connected
to the same local development chain.

The public snapshot records the runtime-reported versions (`0.9.1` and
`0.9.0`). The older capture does not include a reported source commit hash, so
this evidence does not establish exact source-level provenance for that build.
That limitation should be resolved before using the result as a release-to-
release compatibility claim.

The capture sent the same `node_info` and pending-channel `list_channels`
requests to both processes. Both nodes also connected over P2P and accepted a
minimum-valid `open_channel` request. The request remained in
`NegotiatingFunding`; no successful funding claim is made.

## Finding

The two runtime versions are different, but both returned the same channel key
set for this scenario. However,
the live payload contains `failure_detail`, `is_acceptor`, `is_one_way`, and
`pending_tlcs`, while those fields were absent from the compared consumer
`Channel` interface. The public snapshot does not bundle the authoritative SDK
source file or its commit; that must be pinned when the capture is refreshed.

This supports an external consumer-contract review. It does not prove a
protocol regression between the two versions.

## Evidence handling

The committed evidence is sanitized and contains version metadata, schema
observations, classifications, and redacted error classes.

`responses.public.json` is the redacted fixture used by CI. It keeps the
consumer and scenario checks reproducible without exposing local identifiers.

CI validates this committed snapshot; it does not imply that the local node
processes are currently running or that the capture is refreshed automatically.

Raw capture files containing local URLs, invoice addresses, payment hashes, or
node identifiers are excluded from the public repository.
