# Cloudflare allocation investigation

2026-09-16, Node 24.18.0, the earlier @amritk experiment at commit `f10dca9bc` (preserved on `claude/openapi-markdown-amritk-pipeline`). Full correctness testing remains deferred. These historical measurements predate the minimal plain-object implementation. The whitespace optimization is now included at build time; the measurements below describe the earlier isolated experiment.

## Main finding

The remaining allocation hotspot is the generated HTML-to-Markdown conversion, particularly `rehype-minify-whitespace` 6.0.0 (called internally by `hast-util-to-mdast`). Its `content`, `blocklike`, and `skippable` helpers call `isElement(node, arrayOfTagNames)` repeatedly. `isElement` calls `convertElement` on every invocation, which rebuilds an array of predicate closures for every tag name. These tag lists are constant and the predicates can be compiled once.

An Inspector sampling profile with both `includeObjectsCollectedByMajorGC` and `includeObjectsCollectedByMinorGC` enabled estimated 85.0 GiB of cumulative allocation over one full conversion:

| Stack category | Share of sampled allocated bytes |
| --- | ---: |
| Generated HTML to Markdown | 90.8% |
| Vue rendering, excluding examples/descriptions | 3.5% |
| Description Markdown to HTML | 3.5% |
| Example generation, including downstream coercion | 1.2% |
| Document loading, cloning, upgrading, parsing and reference attachment | 0.7% |
| Other | 0.2% |

`hast-util-is-element`'s `anyFactory` alone accounted for approximately 55.3 GiB of sampled self allocation. These are cumulative estimates, **not simultaneous resident or live heap usage**, and profiling adds overhead. The stack categories are assigned from sampled call stacks, not independent stage timings.

## Retained memory versus allocation churn

A separate diagnostic run explicitly collected garbage at selected section boundaries. After collection, the live heap was approximately 109–184 MiB during rendering, and 142 MiB immediately before joining the output. RSS remained around 760 MiB even after collection: committed heap/native allocator pages and RSS do not track live JavaScript objects one-to-one. The retained input, parsed graph, accumulated Markdown and runtime still consume memory, but they do not explain the entire 1.5 GB observed peak.

Explicit collection was used only to diagnose retention. It is not added to the package or proposed as the production fix. The allocation profile itself retains profiling data, so its end-of-run heap is unsuitable for measuring application-only retention.

## Controlled dependency experiment

Temporarily replaced the three repeated `isElement(node, tags)` calls in `rehype-minify-whitespace` with module-level `convertElement(tags)` predicates. No output or schema content was skipped.

| Fresh-process comparison, 6,144 MiB old-space allowance | Peak RSS | Seconds |
| --- | ---: | ---: |
| Current source, previously measured | 1,516,912,640 bytes | 28.35 |
| Precompiled whitespace predicates | 1,216,593,920 bytes | 24.11 |

Both produced 37,609,463 bytes of Markdown with SHA-256 `fe280545a7dbdf8c3c88b81ada51b5ecffc994b3f9c0de2d623a02281c698825`. This is an indicative single-run comparison; it confirms a useful optimization but does not establish a universal peak or achieve the 1 GB target with the larger heap allowance.

The installed dependency was restored byte-for-byte after the experiment. The minimal implementation now bundles the converter and applies the fix at build time: a local pnpm patch alone would not automatically fix consumers installing the published package elsewhere.

Temporary artifacts: `/tmp/markdown-investigation/profile.mjs`, `instrumented.mjs`, `allocations.heapprofile`, `allocations.json`, `summary.txt`, `gc.json`, and `patched.json`. The heap profile is approximately 142 MB and is deliberately not committed.

## Runner integration

[scalar-org PR #6465](https://github.com/scalar/scalar-org/pull/6465) bounds complete route tasks, including their export work, through queued task factories. Its default is twice the worker count (12 routes for six workers), adjustable with `SSG_ROUTE_RENDER_CONCURRENCY`. It addresses unbounded overlap, but does not cap the cost of a single document, deduplicate exports, or add the oversized-document guard. Twelve concurrent large-document exports should not be assumed safe from single-conversion measurements.

The PR is closed without merging. Its closing comment says the build-runner deployment was rolled back; this is a reported rollback, not independently verified current deployment state.
