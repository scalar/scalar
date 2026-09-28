# Linked schema page benchmark

Measured on 2026-09-28 with Node v24.21.0, macOS arm64, Apple M4, and
`--expose-gc --max-old-space-size=768`. Modes ran in separate, sequential processes;
these are single samples, not medians. Normal desktop background activity was present.

Baseline: `@scalar/openapi-to-markdown` 1.3.0 renderer source at
`c439d905a6c0d4267e9c9747b767297826ab2286`. The baseline was compiled from
`bd506efe3a5c69c27e94875a44181dde63d99aa7`, whose package source is byte-identical
(the version metadata differs). Both modules used the same installed workspace
dependencies. The linked implementation is the source accompanying this report.
No loading code was changed; differences in loading times are measurement variation.

## Sources

The same locally saved bytes were used in both modes. Downloads were excluded from timing.

| API | Official source | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Stripe | [API description](https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json) | 8,316,935 | `8b5c2f03d4cd67f51b719b48963b9d47927296fc17eecb49005fc7228f1c077d` |
| Cloudflare | [API description](https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json) | 26,195,362 | `a7b894f05bf367e808ffb5243aa76c51b4950b72827f94578c85829d66f9d6e2` |

## Stripe account before/after

| Markdown export | Default | Linked | Reduction |
| --- | ---: | ---: | ---: |
| `account` model page | 2,409,577 bytes | 6,615 bytes | 99.73% |
| `GET /v1/account` | 2,597,706 bytes | 8,264 bytes | 99.68% |
| All 612 operation + 1,538 model pages | 2,054,383,703 bytes | 7,721,701 bytes | 99.62% |

## Rendering and memory

| Metric | Stripe default | Stripe linked | Cloudflare default | Cloudflare linked |
| --- | ---: | ---: | ---: | ---: |
| Document loading | 0.72 s | 0.74 s | 2.37 s | 2.39 s |
| First selected operation | 432.66 ms | 79.73 ms | 29.02 ms | 19.70 ms |
| All operation/model pages | 278.04 s | 2.16 s | 26.20 s | 16.11 s |
| Peak process RSS | 449.86 MiB | 331.00 MiB | 627.22 MiB | 601.86 MiB |
| Heap used after loading + GC | 52.28 MiB | 52.29 MiB | 139.37 MiB | 139.38 MiB |
| Selected operation bytes | 2,597,706 | 8,264 | 16,501 | 6,113 |
| All operation bytes | 1,616,976,752 | 5,379,422 | 42,404,133 | 19,400,645 |
| All model bytes | 437,406,951 | 2,342,279 | 30,494,074 | 17,449,840 |
| Total bytes | 2,054,383,703 | 7,721,701 | 72,898,207 | 36,850,485 |

Cloudflare contains 3,594 operation pages and 6,925 model pages. Its selected operation
is `GET /zones`. Stripe totals contain 2,150 pages; the introduction page is excluded.

## Interpretation and limitations

- Stripe total Markdown falls from about 2.05 GB to 7.72 MB. Cloudflare total Markdown
  falls from about 72.90 MB to 36.85 MB. Units here are decimal.
- Root fields, inline schemas, compositions and reference siblings remain visible.
  Nested references link to model pages; there is no transitive schema appendix.
- Linked mode omits **all generated examples**, including small ones, with a note.
  Authored examples remain. This contributes to the size reduction; these results
  do not isolate the effect of links alone.
- Loading still processes the entire description. The harness retains the source
  string and a parsed copy to enumerate selectors in both modes. Peak RSS includes
  preparation. The 768 MiB limit controls V8 old-space, not total RSS.
- Total rendering uses one reused renderer after the selected operation and account
  model samples, so normalization caches are partly warm. Pages are rendered and
  discarded one at a time; only example pages are saved.
- This is **isolated renderer performance**, not a full publishing benchmark. It
  excludes routing, Markdown-to-HTML conversion, writing every page, indexing,
  assets, deployment, and network downloads. No `scalar-org` code was changed.
- Inline content, descriptions and supplied examples are not byte-capped. Large
  authored content can still produce large pages. Callback URLs depend on the
  consumer publishing the corresponding models; absent or unsafe URLs become text.

See [benchmark instructions](./README.md#official-api-descriptions) to reproduce
and [raw measurements](./linked-schema-results.json) for memory snapshots and exact
runtime values. Before/after Markdown for both selected operations and Stripe's
account model was saved with this run and delivered as a separate examples archive.
