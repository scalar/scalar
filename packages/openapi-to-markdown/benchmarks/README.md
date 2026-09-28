# Markdown renderer benchmark

Compare the Vue SSR → HTML → Markdown renderer at `f3c39a6723` with the direct
Markdown AST renderer. Both implementations use the same installed dependency
versions, document loader, machine, and Node runtime.

## Run

Build `@scalar/openapi-to-markdown` and its dependencies in a separate worktree at
`f3c39a6723`, then build the current package. From the current package directory:

```sh
node benchmarks/compare.mjs /absolute/path/to/baseline/dist/index.js ./dist/index.js benchmarks/results
```

The first argument can also be a preserved copy of the baseline's compiled module,
provided its dependencies resolve to the same versions as the current build.
The comparison imports only the public `createOpenApiMarkdownRenderer` API.

## Method

- Five independent process samples per implementation and workload, alternating
  old/new order to reduce ordering bias.
- Each worker imports its implementation, constructs the input, forces garbage
  collection, and measures document preparation separately from rendering.
- The first render uses a new renderer. The warmed measurement is the third render
  through that renderer, after one additional untimed render.
- Page-export workloads render every page sequentially through one renderer.
- Reported times include selection, AST construction/conversion, serialization,
  and a small identical output-counting step. They exclude module import time.
- CPU time is the change in process user + system CPU usage. It includes runtime
  worker threads and helps distinguish computation from scheduling delays.
- Peak RSS is the process high-water mark over initialization, preparation, and
  all three renders. It is not an isolated allocation measurement for one render.
- Summary values are medians. All raw samples and output byte counts are retained
  in `results/comparison.json`.

The workloads include the Cloudflare OpenAPI document, Scalar Galaxy 3.1, shared
recursive schemas, long Markdown descriptions, single-operation selection, and
exporting every operation page. The Cloudflare fixture is fetched from GitHub when
the benchmark runs; network fetch time is excluded from renderer measurements.
Synthetic inputs are defined in `fixtures.mjs` and have no random values.

The harness verifies identical heading and generated-example counts between
implementations, and stable counts and output size across repeated renders.
The package's compatibility test separately compares Markdown syntax trees against
a saved legacy output, ignoring only list spacing and boundary whitespace while
preserving exact code blocks and document structure.

## Environment note

The repository requests pnpm 12.2.1, which was unavailable from the configured
registry during this run. Existing installed dependencies were reused in the
isolated worktree; changed upstream production sources were rebuilt there. The
baseline and replacement share those dependencies. Root package-manager settings
were restored, and no dependency installation or build artifacts are committed.


## Official API descriptions

`official.mjs` measures one source/mode in a fresh process. Download each source
once, then reuse those exact bytes for both modules:

```sh
node --expose-gc --max-old-space-size=768 benchmarks/official.mjs \
  /path/to/baseline/dist/index.js /path/to/stripe.json default /path/to/stripe-before
node --expose-gc --max-old-space-size=768 benchmarks/official.mjs \
  ./dist/index.js /path/to/stripe.json linked /path/to/stripe-after
```

Repeat for Cloudflare. The source URLs are:

- https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json
- https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json

Each run saves JSON metrics and the selected operation Markdown (`GET /v1/account`
or `GET /zones`). Stripe also saves the individual `account` model page. Metrics
include source SHA-256, runtime and CPU details, loading time, first-operation
rendering time, total operation/model rendering time, byte counts, memory snapshots,
and process peak RSS. Rendered pages are counted and discarded one at a time.

Loading starts after importing the module and reading the local source file, and
includes parsing, upgrading, and resolving through `createOpenApiMarkdownRenderer`.
The harness retains the source string and a separate parsed copy for enumerating
pages in both modes. All-page timing uses the same renderer after the first-operation
and account-model samples, so its caches are partly warm. Introduction, tag and
webhook pages are excluded from totals. Peak RSS includes module loading and document
preparation; the 768 MiB limit applies to V8 old-space, not total process RSS.

These are isolated renderer measurements. They exclude network download, site
routing, Markdown-to-HTML conversion, writes of every page, indexing, asset processing,
and deployment. They do not measure full publishing performance. Run modes
sequentially to avoid competing benchmark processes, and treat single-run timing
and memory figures as illustrative rather than statistical performance guarantees.
