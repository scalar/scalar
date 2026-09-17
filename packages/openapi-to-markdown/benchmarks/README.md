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

## Implementation

The renderer uses the existing workspace store to load and resolve the API description once. It renders sections sequentially and skips redundant HTML minification when producing Markdown.

The whitespace optimization is applied by `scripts/whitespace-predicates.ts` while bundling the HTML-to-Markdown converter. A dependency source change or accidental externalization fails the build instead of silently dropping the optimization. Bundled dependency licenses are emitted into `dist/THIRD_PARTY_LICENSES.md`.

The plain-loader experiment is preserved at commit `c45edf897`. The earlier @amritk parser experiment remains at commit `f10dca9bc` on `claude/openapi-markdown-amritk-pipeline`.

## Workspace store comparison

Node v24.18.0, fresh sequential processes, 6,144 MiB old-space limit, same section renderer and whitespace fix. These are single-run measurements, not a universal memory bound.

- Input: 25,486,449 bytes, SHA-256 `f13c12da668a8d2e26c28f75a3821a99518dbde36007a380c0846c39696b501c`.

| Loader | Peak RSS | Conversion time | Output bytes |
| --- | ---: | ---: | ---: |
| Previous plain loader with @amritk helpers | 1,166,061,568 bytes | 32.29 s | 36,950,478 |
| Restored workspace store | 2,969,034,752 bytes | 81.15 s | 34,812,158 |

Restoring the workspace store added about 1.80 GB peak RSS in this run. The current implementation exceeds the 1 GB target at the production-sized heap allowance. The loaders produce different Markdown, so this comparison does not establish output equivalence.

- Plain-loader output SHA-256: `f3f18ede6cbe859d436435eba6cb4b5795711d582938e413a12b12f593156357`.
- Workspace-store output SHA-256: `5002305d970df6b7fc2518e7b007dd92a43bb8e6bc435f2532a6fb1b412b40f7`.

The full correctness suite remains deferred. Focused reusable-renderer and large-document tests pass, including file references, input snapshots, proxy inputs, and section ordering.
