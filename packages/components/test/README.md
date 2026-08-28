# Scalar components — Playwright visual tests

Playwright snapshot tests render each component through a **gallery** page and compare screenshots to images under a `snapshots/` folder next to the test file (`snapshotPathTemplate` in `playwright.config.ts`).

## Overview

1. **Gallery** — `./gallery` is a small page that renders one story at a time into `#root`. Playwright starts **`pnpm dev:gallery`** and points `baseURL` at `/test/gallery/index.html`; Vite serves the page from source, so there is nothing to build. If that server is already running on port **5101**, it is reused (`reuseExistingServer`).
2. **Docker browser** — Outside CI, tests connect to Playwright inside **`scalarapi/playwright-runner`** (version pinned in `@scalar/helpers` — see [`playwright/docker`](../../helpers/src/playwright/README.md)). CI runs inside the same image, so only the gallery `webServer` runs there.
3. **Regression detection** — `toHaveScreenshot` diffs against committed PNGs; CI fails when snapshots drift without an update.

> **Storybook is not involved.** It is still the workbench you browse with `pnpm dev`, and it still renders the same `*.stories.ts` files, but it is no longer a test dependency — the suite does not wait on a Storybook build.

## How a test finds its story

Playwright's [`mount()`](https://playwright.dev/docs/api/class-fixtures#fixtures-mount) fixture navigates to the gallery and calls `window.mount({ story, props })`. The story id is `"<Component>/<Story Name>"`, which the helpers infer from your test titles:

```ts
test.describe('ScalarCard', () => {   //  component  ─┐
  test('With Actions', takeSnapshot)  //  story      ─┴─→  "ScalarCard/With Actions"
})
```

The gallery resolves that against the CSF files the workbench already uses: `ScalarCard.stories.ts`, export `WithActions`. It reads `render`, `args`, `component` and `parameters.layout` from them, so **stories stay the single source of truth** — there is no second set to keep in step.

A story that does not exist fails with a real error from `window.mount()` rather than a blank screenshot.

## Running tests

From `packages/components`:

```bash
# Run all Playwright tests (starts Docker runner + gallery unless already up)
pnpm test:e2e

# Limit to one file (pass-through args after the script name)
pnpm test:e2e -- src/components/ScalarCard/ScalarCard.e2e.ts

# Limit to one story by title
pnpm test:e2e -g "With Actions"

# Update snapshots
pnpm test:e2e --update-snapshots
```

Debug with the Playwright UI:

```bash
pnpm test:e2e --ui
```

To poke at the gallery by hand, run `pnpm dev:gallery`, open <http://localhost:5101/test/gallery/index.html> and call `window.mount({ story: 'ScalarCard/Base' })` from the console — that is exactly what the fixture does.

## Non-Linux systems

The runner uses **`--network=host`** so the container can reach the gallery on the host. Docker Desktop on macOS and Windows often does not support host networking; use a runtime that does (for example [OrbStack](https://orbstack.dev/)), or rely on CI for authoritative runs.

If pulls look fine but the image is wrong or stale, pull explicitly — see the helpers README for the tag to use (it tracks the workspace `@playwright/test` version).

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

Prefer scoping queries to the component with the `mountedStory` fixture when a page-wide query would be ambiguous.

### Fixtures and `test.use`

The helpers infer **component** from the nearest `test.describe` title and **story** from the `test` title when you do not set them explicitly. Override or tune behavior with [`test.use`](https://playwright.dev/docs/test-use-options#configuration-scopes).

**Fixtures**

- **`mountedStory`** — Locator for the mounted story's root (runs automatically before your test body).
- **`snapshot(suffix?)`** — Captures a screenshot with a normalized name (optional suffix for multiple shots per story).

**Common options** (`test/helpers.ts`)

- **`component`**, **`story`** — Story id parts; inferred from titles when omitted.
- **`args`** — Passed to `mount()` as props and merged over the story's own args. Unlike the old Storybook URL args these are structured-cloned, so numbers, booleans and objects survive as themselves.
- **`scale`** — Device scale factor for screenshots (default **2**).
- **`background`** — Whether to render with a background (default **false**).
- **`crop`** — `'body'` (default), `'component'` to crop to the story root, or `'viewport'`.
- **`device`** — One of the emulated device keys defined in the helpers (`Chrome`, `Firefox`, etc.).
- **`colorModes`** — `['light']`, `['dark']`, or `['light', 'dark']` for theme-specific captures.
- **`theme`** — A theme variant from `.storybook/themes.ts`, handed to the gallery before navigation.

Implementation details live in `test/helpers.ts` and `test/gallery/main.ts`.
