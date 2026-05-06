# Scalar components — Playwright visual tests

Playwright snapshot tests run against **Storybook**: each `*.e2e.ts` file opens stories in the browser and compares screenshots to images under a `snapshots/` folder next to that file (`snapshotPathTemplate` in `playwright.config.ts`).

## Overview

1. **Storybook** — Locally, Playwright starts **`pnpm preview`**, which serves the **static build** from `storybook-static` (Vite preview, port **5100**). If `pnpm dev` is already running on that port, that server is reused (`reuseExistingServer`).
2. **Docker browser** — Outside CI, tests connect to Playwright inside **`scalarapi/playwright-runner`** (version pinned in `@scalar/helpers` — see [`playwright/docker`](../../helpers/src/playwright/README.md)). CI runs inside the same image, so only the Storybook `webServer` runs there.
3. **Regression detection** — `toHaveScreenshot` diffs against committed PNGs; CI fails when snapshots drift without an update.

## Non-Linux systems

The runner uses **`--network=host`** so the container can reach Storybook on the host. Docker Desktop on macOS and Windows often does not support host networking; use a runtime that does (for example [OrbStack](https://orbstack.dev/)), or rely on CI for authoritative runs.

If pulls look fine but the image is wrong or stale, pull explicitly — see the helpers README for the tag to use (it tracks the workspace `@playwright/test` version).

## Prerequisites

Build Storybook static assets before the first run (or whenever stories change):

```bash
pnpm build:storybook
```

Using the **built** output matches CI and avoids dev-only flakiness in snapshots.

## Running tests

From `packages/components`:

```bash
# Run all Playwright tests (starts Docker runner + Storybook preview unless already up)
pnpm test:e2e

# Limit to one file (pass-through args after the script name)
pnpm test:e2e -- src/components/ScalarCard/ScalarCard.e2e.ts

# Update snapshots
pnpm test:e2e --update-snapshots
```

Debug with the Playwright UI:

```bash
pnpm test:e2e --ui
```

## CI

The components snapshot job runs **`pnpm test:e2e:ci`** inside `scalarapi/playwright-runner`. Mismatched snapshots **fail** the build until you run `pnpm test:e2e:update` and commit the updated images.

## Contributing

When adding or changing components:

1. Add `ComponentName.e2e.ts` beside the component (or extend an existing file).
2. Run `pnpm test:e2e` (or `:update`) and review generated PNGs under `snapshots/`.
3. Commit snapshot changes with the code.

### Basic snapshot test

```ts
import { takeSnapshot, test } from '@test/helpers'

test.describe('ScalarCard', () =>
  ['Base', 'With Actions', 'Minimal'].forEach((story) => test(story, takeSnapshot)),
)
```

`takeSnapshot` is a small wrapper that calls the `snapshot` fixture once with no extra interaction.

### Interaction before capture

```ts
import { test } from '@test/helpers'

test.describe('ScalarDropdown', () =>
  ['Base', 'Custom Classes'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      await page.getByRole('button', { name: 'Click Me' }).click()
      await snapshot()
    }),
  ),
)
```

### Fixtures and `test.use`

The helpers infer **component** from the nearest `test.describe` title and **story** from the `test` title when you do not set them explicitly. Override or tune behavior with [`test.use`](https://playwright.dev/docs/test-use-options#configuration-scopes).

**Fixtures**

- **`openStory`** — Navigates to the configured Storybook story (runs as a fixture dependency before your test body).
- **`snapshot(suffix?)`** — Captures a screenshot with a normalized name (optional suffix for multiple shots per story).

**Common options** (`test/helpers.ts`)

- **`component`**, **`story`** — Storybook ids; inferred from titles when omitted.
- **`args`** — Story args encoded into the Storybook URL.
- **`scale`** — Device scale factor for screenshots (default **2**).
- **`background`** — Whether to render with a background (default **false**).
- **`crop`** — Crop to `#storybook-root > *` instead of full page (default **false**).
- **`device`** — One of the emulated device keys defined in the helpers (`Chrome`, `Firefox`, etc.).
- **`colorModes`** — `['light']`, `['dark']`, or `['light', 'dark']` for theme-specific captures.

Implementation details live in `test/helpers.ts`.
