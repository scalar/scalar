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
