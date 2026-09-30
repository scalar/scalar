# AsyncAPI chunk benchmark

Run after building workspace-store: `node --expose-gc packages/workspace-store/scripts/benchmark-asyncapi-chunks.mjs` from the repository root, or `pnpm --filter @scalar/workspace-store bench:asyncapi-chunks`.

Measured with Node 26.3.1 on September 30, 2026. Each sample runs in a separate process, warms the client, and forces collection before and after loading. Transfer is the sum of individually gzipped JSON responses, including the initial document. Heap is the client heap delta with the server already constructed; it is not a browser measurement. Rendering, SSR HTML, framework memory, request latency, and HTTP headers are excluded. Counts include the initial response. Channel samples load navigation, one channel, and its operation; model samples load one model directly.

Fixtures contain recursive models and one channel/message/operation per model. `properties` has 64 described properties per model; `strings` instead has long descriptions and two properties; `shared` uses the latter models with every message referring to every model. These synthetic cases expose both sparse dependencies and large shared dependency sets.

| Shape | Models | Whole MiB | Whole gzip KiB / requests / heap MiB | Channel gzip KiB / requests / heap MiB | Model gzip KiB / requests / heap MiB |
| --- | ---: | ---: | --- | --- | --- |
| properties | 128 | 0.77 | 52.3 / 1 / 2.67 | 11.6 / 6 / 2.19 | 5.2 / 2 / 0.93 |
| properties | 256 | 1.55 | 103.0 / 1 / 5.39 | 21.8 / 6 / 3.80 | 9.5 / 2 / 1.94 |
| properties | 512 | 3.11 | 204.0 / 1 / 10.84 | 41.4 / 6 / 7.15 | 17.3 / 2 / 3.38 |
| strings | 128 | 0.56 | 33.5 / 1 / 1.18 | 11.4 / 6 / 1.99 | 5.0 / 2 / 0.93 |
| strings | 256 | 1.13 | 66.3 / 1 / 2.67 | 21.7 / 6 / 3.70 | 9.4 / 2 / 1.75 |
| strings | 512 | 2.26 | 130.2 / 1 / 4.56 | 41.2 / 6 / 7.10 | 17.2 / 2 / 3.36 |
| shared | 128 | 1.18 | 38.5 / 1 / 4.93 | 35.0 / 13 / 3.67 | 4.7 / 2 / 0.91 |
| shared | 256 | 3.65 | 101.4 / 1 / 17.91 | 69.0 / 20 / 7.03 | 8.8 / 2 / 1.75 |
| shared | 512 | 12.45 | 253.8 / 1 / 65.12 | 136.6 / 35 / 13.62 | 16.2 / 2 / 3.37 |

## Publication threshold and grouping

Use a conservative 2 MiB threshold for multi-page AsyncAPI references. Single-page references remain whole regardless of size. OpenAPI retains its existing 1 MiB threshold. At 1.18 MiB, the shared fixture saves only 9% of compressed channel transfer while requiring 13 requests. Above 2 MiB, the measured fixtures save 32–80% of channel transfer; the property-heavy case reduces retained heap by 34%, and shared cases by 61–79%.

Group components with identical referring parents up to 64 KiB of serialized content per chunk. Components larger than the target remain singleton chunks. This reduces the 512-model shared case from 517 requests with singleton dependencies to 35 requests. Channels and operations remain separate, and model pages use singleton schema chunks to avoid downloading sibling models. A schema may consequently be emitted both in a group and a singleton file, increasing publication storage. Ordinary independent channel loads require six responses, direct model loads two, in these fixtures.

Description-heavy channel samples retain more heap than whole loading (7.10 versus 4.56 MiB at 512 models), despite 68% lower transfer. Sparse document/reference/navigation bookkeeping can outweigh the savings from excluding strings. This is a tradeoff, not a universal memory improvement. Direct model loads still reduce transfer and heap in that case. The threshold should be revisited against production distributions and browser measurements rather than extrapolated from these fixtures.

## Remaining validation

The publication integration includes browser tests for direct links, hydration, client navigation, recursive messages/models, original downloads, search, server information, and authentication configuration. Those tests require the cloud browser runner and have not been executed in this local session. Browser peak memory and real network latency remain unmeasured.
