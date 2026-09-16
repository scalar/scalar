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

## Minimal implementation

The @amritk experiment remains at commit `f10dca9bc` on `claude/openapi-markdown-amritk-pipeline`. The smaller implementation uses Scalar normalization, upgrading and external-reference bundling, with plain non-enumerable reference links. It does not create a workspace store or document proxies. Existing workspace-store example helpers and types remain dependencies. `getRaw` only unwraps caller-provided magic proxies before cloning; it does not create proxies.

The whitespace optimization is applied by `scripts/whitespace-predicates.ts` while bundling the HTML-to-Markdown converter. A dependency source change or accidental externalization fails the build instead of silently dropping the optimization. Bundled dependency licenses are emitted into `dist/THIRD_PARTY_LICENSES.md`.

Cloudflare was downloaded again for this comparison and differs from the earlier fixture. Do not directly attribute differences from historical numbers to code alone.

- Input: 25,486,449 bytes, SHA-256 `f13c12da668a8d2e26c28f75a3821a99518dbde36007a380c0846c39696b501c`.
- Node v24.18.0, fresh sequential processes.
- Output: 36,950,478 bytes, SHA-256 `f3f18ede6cbe859d436435eba6cb4b5795711d582938e413a12b12f593156357` in all three runs.

| Implementation | Old-space limit | Peak RSS | Conversion time |
| --- | ---: | ---: | ---: |
| Plain loader and sequential SSR, whitespace fix disabled | 6,144 MiB | 1,195,003,904 bytes | 34.21 s |
| Same implementation, bundled whitespace fix enabled | 6,144 MiB | 1,089,662,976 bytes | 29.36 s |
| Same implementation, bundled whitespace fix enabled | 512 MiB | 754,298,880 bytes | 44.23 s |

These single runs indicate about 9% less RSS and 14% less conversion time from the whitespace fix on this implementation. The 1 GB target remains unmet with the larger heap allowance. The smaller-heap timing overlapped development build/check activity and is indicative only.

A targeted runtime inspection checked all reachable objects in a small loaded graph, including non-enumerable cyclic links, using Node's `util.types.isProxy`. It confirmed no proxies, shared recursive/anchor targets, unchanged input and serializable output. The package build and scoped checks passed; the full correctness suite remains deferred. The new plain loader still needs broad compatibility coverage before production release.

Temporary measurement harnesses and results are under `/tmp/markdown-minimal/`. The unpatched comparison changes only the bundled whitespace predicates back to per-call compilation.
