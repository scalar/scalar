# Memory benchmark

Build the package and its workspace dependencies, then run the benchmark in a fresh Node 24 process. Keep the downloaded fixture outside the repository:

```sh
curl -L --fail --output /tmp/cloudflare-openapi.json https://raw.githubusercontent.com/cloudflare/api-schemas/refs/heads/main/openapi.json
pnpm --filter @scalar/openapi-to-markdown build
node --max-old-space-size=512 packages/openapi-to-markdown/benchmarks/memory.ts /tmp/cloudflare-openapi.json
```

The script reports the fixture checksum, input and output sizes, elapsed time, and peak process RSS. It fails if peak RSS exceeds 1,000,000,000 bytes. The fixture is not downloaded by unit tests.

The heap flag limits V8 old space, not total process memory. Always compare fresh processes with the same heap settings and fixture checksum. Also run with the deployment's heap setting: a larger heap can retain more temporary allocations before garbage collection, even if the conversion fits in a smaller heap. Concurrent conversions and output strings retained by the caller add to the memory budget.

The API still returns a complete string. Sequential section conversion avoids a whole-document syntax tree; it does not impose a universal memory bound on arbitrary inputs, individual oversized sections, or concurrent callers.
