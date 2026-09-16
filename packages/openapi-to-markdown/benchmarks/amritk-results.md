# Cloudflare: @amritk pipeline comparison

Experimental branch: `claude/openapi-markdown-amritk-pipeline`.

Input: [Cloudflare OpenAPI document](https://raw.githubusercontent.com/cloudflare/api-schemas/refs/heads/main/openapi.json), downloaded for this investigation on 2026-09-16.

- SHA-256: `1f7cb3852b2f421ef3a767bc2abd851c65bdabe72bf0c58b705522b1883ff9ba`
- 25,494,802 bytes; 2,207 paths; 3,523 operations; 6,771 component schemas.
- Node v24.18.0, Linux. Each measurement uses a fresh process.
- @amritk source: [commit c18e38e395d84ea0d109967da96399ec526836f8](https://github.com/amritk/api-reference/tree/c18e38e395d84ea0d109967da96399ec526836f8/src/store).

The comparison keeps the sequential section renderer and SSR compilation from the preceding experiment. The baseline loader uses Scalar's upgrade, bundle and magic-proxy helpers without the editable workspace store. The alternative replaces that loader with @amritk YAML parsing, external-only bundling, the generated coercion parser, and non-enumerable shared reference pointers. It retains Scalar's upgrade step and rendering/example helpers.

| Loader | V8 old-space cap | Peak process RSS | Conversion time | Output bytes |
| --- | ---: | ---: | ---: | ---: |
| Previous lightweight Scalar loader | 6,144 MiB | 1,838,329,856 bytes | 39.0 s | 34,796,181 |
| @amritk pipeline | 6,144 MiB | 1,490,907,136 bytes | 36.2 s | 37,609,463 |
| @amritk pipeline | 512 MiB | 760,877,056 bytes | 39.6 s | 37,609,463 |

The 6,144 MiB comparison reduces peak RSS by about 19%. It does not yet meet the 1 GB RSS target at that heap setting. The 512 MiB run completes below 1 GB total process RSS. Heap caps and RSS are different measurements; these are per-conversion measurements, not a guarantee for concurrent SSG builds. Timings are indicative single runs, and the two large-heap runs overlapped.

## Output verification

Both versions produce the same complete heading sequence (10,319 level-three headings) and 21,799 fenced code blocks. After removing fenced code blocks, all remaining lines match exactly. Of the fenced blocks, 15,027 differ, including generated examples and security JSON. The Markdown is approximately 2.8 MB larger with the alternative pipeline.

A targeted nested-schema test demonstrates one improvement: a response example that previously contained `"child": null` now includes the referenced child object and its `"name": "Alice"` example. A regression test covers this case. The comparison establishes unchanged prose and section coverage; it does not prove that every changed generated JSON value is preferable.

## Reproduce the current pipeline

```sh
pnpm --filter @scalar/openapi-to-markdown build
node --max-old-space-size=512 packages/openapi-to-markdown/benchmarks/memory.ts /tmp/cloudflare-openapi.json
```

Repeat with `--max-old-space-size=6144` to test the production heap cap. The benchmark intentionally exits unsuccessfully if RSS exceeds the 1,000,000,000-byte budget, even when conversion succeeds.

Raw comparison logs and full Markdown artifacts from this run are in `/tmp/cloudflare-{baseline,amritk}*`. They are temporary artifacts, not committed fixtures. Parser provenance and integration details are documented in `src/amritk/README.md`.

## Further allocation work (full test suite deferred)

The source now resolves schemas for display without repeating TypeBox coercion, and parses generated HTML without allocating source locations. The HTML-to-Markdown step retains sanitization and the same Markdown serializer. Cloudflare output remains 37,609,463 bytes with SHA-256 `fe280545a7dbdf8c3c88b81ada51b5ecffc994b3f9c0de2d623a02281c698825`.

| Current source | V8 old-space cap | Peak process RSS | Conversion time |
| --- | ---: | ---: | ---: |
| Package memory benchmark | 512 MiB | 877,416,448 bytes | 30.0 s |
| Comparison harness, including output checksum | 6,144 MiB | 1,516,912,640 bytes | 28.3 s |

These changes improve runtime, but do **not** establish a further reduction in peak RSS over the earlier @amritk measurements. The 1 GB target is met for this fixture with a 512 MiB old-space limit; it remains unmet with the production-sized 6,144 MiB allowance. Do not interpret a successful bounded-heap run as a package-level memory guarantee. No production runner configuration was changed.

A 384 MiB run after removing source locations but before removing display coercion completed at 892,837,888 bytes RSS in 33.9 seconds. A 256 MiB run exhausted its heap. Lower heap caps do not necessarily produce monotonically lower RSS because garbage collection and allocation behavior change.

Additional benchmark-only experiments bypassed all schema coercion, bypassed Vue component instances, disabled example caching, stored output in byte buffers, and cached rendered descriptions. None established the 1 GB target with the large heap allowance. These experimental overrides are **not** included in the package.

The package build (including declaration type checking) and scoped lint/format checks completed; the full correctness suite is deferred at the user's request. Cloudflare output checksums only establish parity for this fixture, not general compatibility of the new parser pipeline.
