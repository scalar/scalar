# API reference end-to-end tests

Playwright tests for `@scalar/api-reference`: feature flows, configuration behavior, committed **visual snapshots**, and standalone layout checks.

## Overview

- **Docker-backed browser** — Outside CI, tests connect to Playwright inside **`scalarapi/playwright-runner`** so fonts and rendering match Linux CI. See [`@scalar/helpers/playwright`](../../helpers/src/playwright/README.md).
- **Serving examples** — Most tests get a URL from **`serveExample`** (`test/utils/serve-example.ts`), a **Hono** server that serves HTML plus the local standalone bundle. This is not the Vite dev playground; build the package before running E2E.
- **Visual snapshots** — Under `test/snapshots/`, Playwright compares screenshots to images committed under each test’s `.snapshots` directory.
- **CDN comparison** — A separate suite under [`test/snapshots-cdn/`](./snapshots-cdn/README.md) diffs local builds against the latest package on jsDelivr (`TEST_MODE=CDN`). It is optional context and **non-blocking** in CI.

## Prerequisites

1. Install dependencies and build upstream packages as usual for the monorepo.
2. Ensure the **standalone browser bundle** exists (E2E loads `dist/browser/standalone.js`). From `packages/api-reference`, a full package build satisfies this.

## Non-Linux / Docker networking

On macOS or Windows, the runner container uses **`--network=host`**. Docker Desktop often does not support host networking; use an implementation that does (for example [OrbStack](https://orbstack.dev/)), or rely on CI for authoritative snapshot runs.

## Running tests

From `packages/api-reference`:

```bash
# Default E2E (features, snapshots, configuration, standalone)
pnpm test:e2e

# Refresh committed baseline screenshots after intentional UI changes
pnpm test:e2e --update-snapshots
```

Debug with the Playwright UI:

```bash
pnpm test:e2e --ui
```

**CDN vs local** visual checks (different config; see `test/snapshots-cdn/README.md`):

```bash
pnpm test:e2e:cdn
```

## CI

The **`test-e2e-api-reference`** job runs `pnpm --filter api-reference test:e2e:ci` inside `scalarapi/playwright-runner`. Snapshot and screenshot assertions are **blocking**: fix regressions or update baselines with `pnpm test:e2e:update-snapshots` and commit the changed images.

The **CDN snapshot** job is separate, informational, and does not block merges.
