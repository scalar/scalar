# AsyncAPI renderer benchmark

Run `pnpm --filter @scalar/asyncapi-to-markdown benchmark` from the repository root.
The deterministic fixture reuses a 100-property message across 60 operations.
The harness measures preparation separately and prints five rendering samples,
output bytes, and process RSS for complete, single-operation, and linked exports.
RSS describes the process, not isolated renderer allocations. The first sample is
cold; subsequent samples reuse the prepared renderer. Every sample checks stable
output and rejects unexpected schema truncation. No network access is needed.
