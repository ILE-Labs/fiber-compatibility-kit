# Architecture and funding gate

## Decision before deeper implementation

The target runtime has an evolving RPC surface, including breaking changes and
response fields that are not represented in the consumer type surface used by
this capture. Current evidence demonstrates a consumer contract gap, not a
0.9.0-to-0.9.1 protocol regression.

The project should therefore be presented as an external compatibility kit, not
as a generic test suite and not as a claimed upstream bug.

## Independent value

The kit must remain useful even if no upstream merge occurs. A downstream team
should be able to run it against pinned `fnn` binaries and receive:

- redacted RPC captures;
- a schema-level compatibility report;
- a contract-gap report;
- machine-readable PASS/WARN/BLOCK classifications;
- reproduction commands and version metadata.

The first consumer targets are `fiber-js` and applications that consume its
channel and payment data. The kit must not modify a live node or depend on
private production data.

## Required implementation gates

### Gate A — source of truth

Pin the exact runtime and SDK commit or tag used for each run. Compare the live
response with the authoritative public documentation and SDK types. If a field
is intentionally omitted, record that decision instead of calling it a
regression.

### Gate B — consumer artifact

Maintain a small TypeScript fixture that parses a captured `list_channels`
response and demonstrates the practical consequence of missing fields. The
fixture must fail before the declaration is applied and pass afterward.

### Gate C — second scenario

Run an additional observable scenario, such as a channel transition or
payment/invoice response, against two pinned versions. Classify results as:

- `VERSION_COMPATIBLE`;
- `VERSION_DIFFERENCE_REVIEW_REQUIRED`;
- `SDK_CONTRACT_GAP`;
- `INCONCLUSIVE`.

No version regression may be claimed without incompatible behavior or a
maintainer confirming the compatibility impact.

### Gate D — external usefulness

Publish the evidence package and ask SDK or downstream maintainers which
repository should consume the fixture or type correction. This is an adoption
gate after the artifact exists, not permission to begin building it.

## Conditional 6,500 USD-equivalent phase

This request should not be submitted until Gates A-C pass and at least one
downstream maintainer confirms that the artifact is useful.

1. **Consumer contract package — 2,400, weeks 1-2**
   - pinned version metadata;
   - redacted live fixtures;
   - TypeScript consumer fixture;
   - contract-gap classification;
   - reproducible report command.

2. **Cross-version matrix — 2,600, weeks 3-4**
   - additional live RPC/payment scenarios;
   - two or more pinned versions;
   - machine-readable PASS/WARN/BLOCK output;
   - negative and malformed-response cases;
   - comparison against public documentation and existing tests.

3. **Release and maintenance — 1,500, weeks 5-6**
   - integration-ready fixture or patch;
   - consumer documentation;
   - public compatibility matrix;
   - maintainer review record;
   - 60-day compatibility fixes for tested versions.

## Stop conditions

Stop before funding submission if the second scenario produces no actionable
difference, the fixture has no downstream use, the fields are intentionally
excluded, or an existing tool already provides the same artifact.
