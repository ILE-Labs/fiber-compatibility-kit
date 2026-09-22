# Live evidence: versions 0.9.0 and 0.9.1

Captured on 2026-09-22 from two separately compiled node processes connected
to the same local development chain.

The capture sent the same `node_info` and pending-channel `list_channels`
requests to both processes. Both nodes also connected over P2P and accepted a
minimum-valid `open_channel` request. The request remained in
`NegotiatingFunding`; no successful funding claim is made.

## Finding

Both versions returned the same channel key set for this scenario. However,
the live payload contains `failure_detail`, `is_acceptor`, `is_one_way`, and
`pending_tlcs`, while those fields are absent from the checked-in consumer
`Channel` interface.

This supports an external consumer-contract review. It does not prove a
protocol regression between the two versions.

## Evidence handling

The committed evidence is sanitized and contains version metadata, schema
observations, classifications, and redacted error classes.

`responses.public.json` is the redacted fixture used by CI. It keeps the
consumer and scenario checks reproducible without exposing local identifiers.

Raw capture files containing local URLs, invoice addresses, payment hashes, or
node identifiers are excluded from the public repository.
