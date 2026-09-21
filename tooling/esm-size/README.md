# Configuration-specific ESM size harness

Research for [scalar/scalar#9789](https://github.com/scalar/scalar/issues/9789). This harness serves **built production ESM**, opens a fresh Chromium context with caching disabled, and measures the JavaScript files actually requested by a configuration. The existing ESM playground imports source and is unsuitable for this measurement.

## Run

From the repository root, install dependencies and build packages using the repository prerequisites (`pnpm install`, then `pnpm build:packages`). Install Chromium once with `pnpm exec playwright install chromium`.

```sh
pnpm exec tsx tooling/esm-size/run.ts --output /tmp/scalar-esm-size.json
```

The default configuration is the issue's read-only Petstore reproduction. Pass another configuration as JSON with `--config path/to/config.json`. Function-valued configuration is not supported.

For repeatable comparisons, download the API description once and reuse it:

```sh
curl -fLsS https://petstore3.swagger.io/api/v3/openapi.json -o /tmp/petstore.json
pnpm exec tsx tooling/esm-size/run.ts \
  --document /tmp/petstore.json \
  --throttle \
  --output /tmp/scalar-esm-size.json
```

`--document` replaces the single configuration URL with a local fixture; the report records its SHA-256. It rejects configurations with `content` or `sources`. Use a self-contained JSON description: relative external references will resolve against the local server. Without this option, the original remote URL is fetched normally.

Other options:

| Option | Meaning |
| --- | --- |
| `--build DIR` | Directory containing `standalone.esm.js` and `chunks/`; defaults to `packages/api-reference/dist/browser` |
| `--selector CSS` | Readiness marker; defaults to the first `.operation-title` |
| `--settle-ms 2000` | Observation window after the operation marker appears |
| `--throttle` | Chromium: 1 Mbps download/upload, 40 ms latency, 4× CPU slowdown |
| `--budget-gzip BYTES` | Exit nonzero when requested JavaScript exceeds this gzip budget |
| `--open-modal` | Open the first Test Request button after startup (requires a configuration with test requests enabled) |
| `--client LABEL` | Select a client by its exact picker option label after the startup snapshot |
| `--expect-code TEXT` | With `--client`, wait for this text in the first request sample |
| `--language NAME` | With `--client`, wait for highlighted spans in that language |
| `--screenshot FILE` | Capture the first request sample after optional interaction |
| `--output FILE` | JSON report; parent directory must already exist |

For build experiments, use a fresh output directory to avoid stale chunks:

```sh
pnpm --filter @scalar/api-reference build:standalone:esm --outDir /tmp/scalar-esm-experiment
pnpm exec tsx tooling/esm-size/run.ts \
  --build /tmp/scalar-esm-experiment \
  --document /tmp/petstore.json \
  --budget-gzip 750000
```

The example 750,000-byte budget is a proposed post-modal target, **not** a budget the current baseline passes.

## What the numbers mean

- `atOperation`: full sizes of unique built JavaScript URLs requested by the readiness milestone, including requests still in flight.
- `settled`: the same accounting after the observation window. This captures mount-triggered dynamic imports; it does not imply network idle or include future interactions.
- `inventory`: all JavaScript in the build directory except the UMD `standalone.js`, including unrequested chunks. Use a fresh build directory for an accurate inventory.
- Each file has raw bytes, gzip level 9 bytes, Brotli quality 11 bytes, a SHA-256, and request flags. Compressed totals sum **individually compressed files**, as a CDN would deliver them. These are reproducible payload estimates, not CDN wire measurements. The local server sends gzip.
- Injected CSS counts because it is inside the JavaScript. Maps, build statistics, HTML, API-description bytes, fonts, external resources, and HTTP headers are excluded from JavaScript totals. The request list exposes external requests separately.
- `operationVisibleMs` measures navigation to Playwright's first visible operation title (nonempty box, not CSS-hidden). It does **not** require viewport intersection, finished highlighting, or the specific `Find pet by ID.` operation from the issue. Use a more specific selector for another milestone. Consequently these timings cannot be directly compared with the issue's old UMD timings.
- Page exceptions, failed requests, and HTTP errors observed during the window cause a nonzero exit, as does an exceeded budget. Missing builds and readiness timeouts also fail the run. Late failures after the window are outside its scope.

An optional interaction runs after the startup snapshot, leaving the startup budget unchanged:

```sh
pnpm exec tsx tooling/esm-size/run.ts \
  --document /tmp/petstore.json \
  --client Requests --language python --expect-code requests \
  --screenshot /tmp/scalar-python.png \
  --output /tmp/scalar-python.json
```

`interaction.total` includes all requested JavaScript through the selection. Compare it with `settled`; files marked `requestedAtStartup: false` show what arrived later. Screenshots can scroll the page and trigger more virtualized content after the startup snapshot. Use `--open-modal` with test requests enabled to measure the modal after opening; search and downloads still need separate scenarios.

## Validation

```sh
pnpm exec biome check tooling/esm-size/run.ts
pnpm exec prettier --check tooling/esm-size/*.json tooling/esm-size/*.md
pnpm exec tsc -p tooling/esm-size/tsconfig.json
```

Browser smoke runs cover the issue configuration, the modal experiment, lazy highlighting/generation, and Python selection. An intentionally impossible `--budget-gzip 1` run verifies exit status 1 and `budgetPassed: false`. This tooling does not change a published package and needs no changeset.
