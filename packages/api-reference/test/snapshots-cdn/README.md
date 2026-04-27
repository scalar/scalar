# CDN vs local snapshot tests

This folder holds Playwright tests that compare **full-page screenshots** of the API reference when it loads **`@scalar/api-reference` from jsDelivr** versus when it loads the **standalone bundle built from your branch** (`https://cdn.jsdelivr.net/npm/@scalar/api-reference` vs local `scalar.js`).

## Why this exists

Released npm assets and `main` can diverge, so a failing diff does not always mean your PR broke the UI. Treat results as a signal: unexpected changes are worth inspecting; noise from unreleased work elsewhere on `main` is normal.

## How it works

1. **HTML examples** — Tests use `serveExample` from `test/utils/serve-example.ts`: a small **Hono** app serves HTML from `@scalar/core`’s `getHtmlDocument`, either with a `cdn` URL (jsDelivr) or the local bundle from the package `browser` field (`dist/browser/standalone.js`).
2. **Browser environment** — Locally, Playwright talks to **`scalarapi/playwright-runner`** via `PW_TEST_CONNECT_WS_ENDPOINT` (see [`@scalar/helpers/playwright`](../../../helpers/src/playwright/README.md)). CI runs the same image as the job container and uses `pnpm test:e2e:cdn:ci` (no separate Docker `webServer`).
3. **Per test** — For each entry in `test/utils/sources`: open the CDN-backed page, wait for a stable body ARIA snapshot, capture a full-page PNG as the **expected** image; open the local-backed page, then `toHaveScreenshot` compares the local render to that PNG.

## Prerequisites

Build `@scalar/api-reference` first so the standalone JavaScript bundle exists (same requirement as the rest of the package E2E tests).

## Running locally

From `packages/api-reference`:

```bash
pnpm test:e2e:cdn
```

You need Docker (or a compatible runtime) that supports **`--network=host`** for the Playwright runner, same as the main E2E tests. Docker Desktop on macOS/Windows often does not; alternatives such as [OrbStack](https://orbstack.dev/) are commonly used.

## CI

The **`test-cdn-snapshots`** workflow runs `pnpm --filter api-reference test:e2e:cdn:ci`. A custom reporter (`test/utils/ci-reporter.ts`) treats failures as **non-blocking** so mismatches do not fail the merge; HTML/JSON reports are still produced for review (including PR comments when configured).
