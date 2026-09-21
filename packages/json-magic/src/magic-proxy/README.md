# Dynamic reference caching

`createMagicProxy` keeps ordinary objects in the existing target-keyed cache. An active dynamic scope uses an interned scope array and a second cache keyed by `(scope, raw target)`. The same path returns the same proxy; different bindings may return different proxies for the same template.

## Scan cost

Reference indexing (`getSchemas`) already walks the document when the root proxy is created. The added `containsDynamicRef` probe is separate and lazy. It runs at most once per root proxy, when traversal first reaches a candidate resource with `$id`, `$defs`, or `$dynamicAnchor`. The result is shared with all descendant proxies, including a negative result.

A document without those keywords never runs the added probe. A document with `$id` or `$defs` but no `$dynamicRef` can pay for one extra full document scan. It then keeps the ordinary cache. The benchmark covers both cases; absence of dynamic references does not mean zero overhead.

An unrelated `$dynamicRef` does not activate scoped caching for anchor-free resources. The scope starts only when a candidate resource actually contains a dynamic anchor. After that, resource boundaries remain in the scope even without a matching anchor, so resolution respects bookending.

## Cache lifetime and size

The cache is lazy and has no fixed size cap or eviction. Eviction would make the next access create a different proxy for a live `(scope, target)` pair, breaking identity relied on by Vue and cycle detection. Memory scales with the distinct resource scopes and targets actually visited, not with the number of repeated reads. More complex resource paths can create more scopes than the number of endpoints.

Both the scope interning cache and the scoped proxy cache use nested WeakMaps. They are owned by the root proxy's shared context. Treat visited entries as document-lifetime allocations while the document and its resources remain reachable; weak keys allow collection after those roots and proxies are discarded. This is not a process-wide cache or a bounded LRU.

The 64-binding regression visits seven scoped targets per binding: the template, its property map, array schema, dynamic item reference, bound item, its property map, and its scalar property. It observes 64 distinct template proxies and 448 scoped proxies across all ten passes, with the same counts after every pass. These counts exclude ordinary root/binding proxies and cache bookkeeping; they are not heap-byte measurements.

## Performance measurements

The repeatable suite lives in `packages/api-reference/src/components/Content/Schema/proxy-performance.bench.ts`. Its synthetic OpenAPI 3.1 document has 2,000 operations, 200 shared schemas, and 20 scalar fields per schema. It measures root proxy creation/reference indexing, cold and warm response-schema reads, complete workspace-store ingestion, and mounting one expanded response schema in Vue/jsdom.

Vue/jsdom measures component mounting only; it does not measure browser layout or paint. Store ingestion includes cloning the input. Fixture construction is outside timed sections. The resource variant adds `$id` and `$defs` but no dynamic references.

Results are local measurements, not CI thresholds or a general claim about all API descriptions.

### Local comparison

Measured on macOS arm64 with Node 24.8.0 and Vitest 4.1.10. The comparison uses the proxy from the PR merge-base (`94091b585f`) and PR head (`14b3381fde`), with the remaining store/renderer code held at the PR version. Temporary source aliases avoid stale installed workspace builds. A selector delegates proxy creation to the relevant implementation, and raw unwrapping supports both implementations; baseline and PR measurements alternate order in the same process. Each row is the median of ten samples after four warm-up pairs.

| Resource keywords | Operation                          | Base (ms) | PR (ms) | Change |
| ----------------- | ---------------------------------- | --------: | ------: | -----: |
| None              | Store ingestion                    |    318.16 |  319.71 |  +0.5% |
| None              | Vue mount (20 fields)              |      9.60 |    8.77 |  -8.6% |
| None              | Proxy creation + indexing          |      1.86 |    1.81 |  -3.0% |
| None              | Cold reads (all 2,000 responses)   |     28.15 |   32.85 | +16.7% |
| None              | Cached reads (all 2,000 responses) |     29.90 |   33.13 | +10.8% |
| `$id` + `$defs`   | Store ingestion                    |    314.17 |  334.30 |  +6.4% |
| `$id` + `$defs`   | Vue mount (20 fields)              |      8.40 |   10.15 | +20.8% |
| `$id` + `$defs`   | Proxy creation + indexing          |      1.81 |    1.90 |  +5.0% |
| `$id` + `$defs`   | Cold reads (all 2,000 responses)   |     34.76 |   36.61 |  +5.3% |
| `$id` + `$defs`   | Cached reads (all 2,000 responses) |     27.89 |   25.38 |  -9.0% |

The ordinary-document case is not free: this run observed about 4.7 ms additional cold-read time and 3.2 ms additional cached-read time across 2,000 responses. Store ingestion differed by 1.6 ms without resource keywords and 20.1 ms with them. The small Vue mount measurements varied in both directions. Ten local samples on a shared machine cannot establish a reliable browser-render regression or improvement; these figures describe this workload, not a performance guarantee. Earlier separate-process runs were strongly affected by concurrent machine load and are excluded from this comparison.

To rerun the benchmark suite after installing and building the workspace dependencies:

```sh
pnpm vitest bench --run --config packages/api-reference/vitest.config.ts packages/api-reference/src/components/Content/Schema/proxy-performance.bench.ts
```

The benchmark suite uses Vitest's timed sampling and reports means; the alternating comparison above reports medians. Do not compare those statistics as if they were the same measurement.
