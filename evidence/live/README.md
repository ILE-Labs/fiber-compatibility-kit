# Live evidence: versions 0.9.0 and 0.9.1

Captured on 2026-09-22 from two separately compiled `fnn` processes connected
to the same local development chain.

The capture sent the same `node_info` and pending-channel `list_channels`
requests to both processes. Both nodes also connected over P2P and accepted a
minimum-valid `open_channel` request. The request remained in
`NegotiatingFunding`; no successful funding claim is made.

Finding: both versions returned the same channel key set for this scenario, but
the live payload contains `failure_detail`, `is_acceptor`, `is_one_way`, and
`pending_tlcs`, which are absent from the checked-in `fiber-js` `Channel`
interface. This supports an external contract-conformance task. It does not
prove a protocol regression.

The committed files are sanitized and contain version metadata, schema
observations, classifications, and redacted error classes.

`responses.public.json` is the redacted fixture used by CI. It keeps the
consumer and scenario checks reproducible without publishing raw captures.

Do not publish `responses.json` or `payment-scenario.json`. They are local raw
captures and are ignored by Git because they may contain invoice addresses,
payment hashes, node identifiers, or local RPC URLs.
