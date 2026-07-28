# Corpus: real Cursor Bugbot comments on scalar/scalar

Fourteen comments collected from seven pull requests between 2026-06-17 and
2026-07-27. Bodies are verbatim; the "Fix in Cursor" / "Fix in Web" button markup
and the base64 deep links are stripped, since they are Cursor product plumbing
rather than review content.

Note that six of these seven PRs are `claude/*` branches — the corpus is
largely Bugbot reviewing Claude's own work.

---

## High severity

### PR #9772 — `.github/workflows/release.yml`

> ### Filter misses changelog generator
>
> **High Severity**
>
> The turbo filter `./{packages,integrations,tooling/changelog-generator}/**` expands to `./tooling/changelog-generator/**`, which matches nested paths under that package, not the package root at `tooling/changelog-generator`. Elsewhere this repo uses `./tooling/**` to select that package. As written, `@scalar-internal/changelog-generator` is still skipped, so `changeset version` can keep failing with `MODULE_NOT_FOUND`.
>
> Locations: `.github/workflows/release.yml#L208-L209`

The author replied that the filter did in fact include the package on the pinned
turbo version, but changed it anyway to avoid depending on per-version glob
behaviour. Worth noting as a calibration point: the finding was arguably wrong on
the facts and still produced a better diff.

---

## Medium severity

### PR #9699 — `scalar.config.json`

> ### Enterprise missing pageTitle disable
>
> **Medium Severity**
>
> `/enterprise` was given SEO `head` metadata but not `layout.pageTitle: false`. Like `/`, `/pricing`, and `/customers`, it uses a custom `level="1"` hero with no markdown H1, so the default injected title H1 can still appear beside the hero and leave two H1s.
>
> Locations: `scalar.config.json#L2844-L2885`

> ### Missing SEO title overrides
>
> **Medium Severity**
>
> The PR disables injected titles with `pageTitle: false` on `/` and `/pricing`, and renames markdown H1s on Docs/API References/CLI getting-started pages, but never adds the page-level `head.title` overrides the summary relies on. Only `/enterprise` got a `head.title`. Document titles stay as sidebar labels like `Introduction` and `Getting Started`, so the claimed unique SEO titles are not applied and H1s now diverge from `<title>` on those getting-started pages.
>
> Locations: `scalar.config.json#L729-L732`, `scalar.config.json#L758-L761`, `documentation/guides/docs/getting-started.md#L1-L1`

> ### Share images lost site-wide
>
> **Medium Severity**
>
> `og:image` and `twitter:image` were moved from global `siteConfig.head.meta` onto the homepage route only, while `twitter:card` was set to `summary_large_image` for every page. Non-homepage shares on Slack/X/LinkedIn now have no preview image, despite declaring a large-image card. The PR intended to scope only title/description tags to the homepage; the brand images should remain global.
>
> Locations: `scalar.config.json#L37-L58`, `scalar.config.json#L708-L725`

### PR #9596 — `packages/api-client/.../DataTableCheckbox.vue`

> ### Checkbox flickers on async updates
>
> **Medium Severity**
>
> The `nextTick` re-assert of `checked` runs before async parent updates land. OAuth scope toggles go through `withHook` in `workspace-events.ts`, which is `async` and yields before `updateSelectedScopes` mutates the store, so `props.modelValue` is still stale when the reset runs. That briefly reverts a successful toggle (visible via `peer-checked`) before the later re-render corrects it. The change is not a no-op when the model updates after the tick.
>
> Locations: `packages/api-client/src/v2/components/data-table/DataTableCheckbox.vue#L31-L39`

### PR #9648 — Playwright Docker runner

> ### Chromium-only image breaks Nuxt Firefox
>
> **Medium Severity**
>
> Switching the runner image to `playwright install --with-deps chromium` drops Firefox from `/ms-playwright`, but `integrations/nuxt/playwright.config.ts` defines a `firefox` project and CI runs `pnpm --filter @scalar/nuxt test:e2e` inside `scalarapi/playwright-runner` in `test-integrations`. After the image is rebuilt and pushed, those Firefox runs will fail because the browser binary is missing.
>
> Locations: `tooling/scripts/src/commands/playwright-docker/DockerfileRunner#L13-L17`, `tooling/scripts/src/commands/playwright-docker/Dockerfile#L13-L17`

> ### Playwright Docker version mismatch
>
> **Medium Severity**
>
> The catalog pins `@playwright/test` to `1.61.1`, but `getDockerServer` still defaults to `scalarapi/playwright-runner:1.59.1` via `DEFAULT_PLAYWRIGHT_VERSION` in `packages/helpers/src/playwright/docker.ts`. Local e2e for api-reference, components, and scalar-app connect a 1.61.1 test client to a 1.59.1 container, which the helper docs say must stay aligned on major/minor.
>
> Locations: `pnpm-workspace.yaml#L36-L37`

> ### Docker publish version out of sync
>
> **Medium Severity**
>
> The `update-playwright-docker` command now builds and pushes `scalarapi/playwright-runner:1.61.1`, but CI workflows, `pnpm-workspace.yaml` (`@playwright/test`: 1.59.1), and `DEFAULT_PLAYWRIGHT_VERSION` in `@scalar/helpers/playwright/docker` still pin 1.59.1. Running the script publishes images the repo never pulls, so the Chromium-only Dockerfile change will not reach e2e jobs until tags and pins are updated together.
>
> Locations: `tooling/scripts/src/commands/playwright-docker/push-container.ts#L7-L8`

### PR #9584 — deepObject parameter handlers

> ### Stale array schema on rename
>
> **Medium Severity**
>
> When a user commits a rename on a `deepObject` expanded row that was an array leaf, `getExpandedObjectPayload` still picks array coercion from the stale row's `schema` or display `][]` name, even if the new key no longer denotes an array. Scalar values like `active` can be stored as one-element arrays at the new path.
>
> Locations: `packages/api-client/src/v2/blocks/request-block/helpers/create-parameter-handlers.ts#L105-L107`

### PR #9559 — `SchemaProperty.vue`

> ### Duplicate properties with allOf
>
> **Medium Severity**
>
> For schemas that combine top-level `allOf` with factored-out `properties`, the new `shouldRenderObjectProperties` path renders those properties in a nested `Schema`, while the existing `allOf` `SchemaComposition` still renders `mergeAllOfSchemas`, which already merges the same sibling `properties` into its result. The factored fields can appear twice in the reference UI.
>
> Locations: `packages/api-reference/src/components/Content/Schema/SchemaProperty.vue#L109-L130`, `packages/api-reference/src/components/Content/Schema/SchemaProperty.vue#L313-L366`

---

## Low severity

### PR #9689 — `process-body.ts`

> ### Inline object check duplicates helper
>
> **Low Severity**
>
> The new array-item guard uses an inline `typeof … === 'object' && … !== null` check that duplicates `isObjectLike` from `@scalar/helpers`. `@scalar/helpers` is already a direct dependency of this package, so the shared helper can replace that part of the predicate (with the existing `File` exclusion kept).
>
> Locations: `packages/blocks/src/code-example/helpers/operation-to-har/process-body.ts#L133-L134`
>
> `Triggered by learned rule: Prefer @scalar/helpers shared utilities over local type guard reimplementations`

This is the only comment in the corpus carrying a learned rule, and the only one
that reads like a convention nit rather than a defect — the two facts are
probably related.

### PR #9596 — `DataTableCheckbox.vue`

> ### Redundant checkbox sync watch
>
> **Low Severity**
>
> The new `watch` on `modelValue` duplicates what `:checked="modelValue"` already does when the prop changes, and it never runs when the parent leaves `modelValue` unchanged—the case the PR description calls out. The imperative DOM write adds shared-component complexity without changing behavior.
>
> Locations: `packages/api-client/src/v2/components/data-table/DataTableCheckbox.vue#L32-L40`

### PR #9584 — deepObject parameter handlers

> ### Empty bracket segment rename paths
>
> **Low Severity**
>
> `parseBracketKey` drops every empty `[]` capture, not only the display-only trailing `[]` on array leaves. A deepObject row whose wire-style name is `filters[]` (value path `['']`) parses to `['filters']`, so `getEditedValuePath` no longer returns `['']` on rename and the value can be written under the wrong key.
>
> Locations: `packages/api-client/src/v2/blocks/request-block/helpers/create-parameter-handlers.ts#L24-L32`

> ### Array marker fallback too broad
>
> **Low Severity**
>
> Schema-less array detection uses `contextRow.name.endsWith('[]')`, but the same file treats only a `][]` suffix as the display-only deepObject array marker. A lone `filters[]` row (empty property key) also ends with `[]`, so it can be misclassified as an array and comma-split on write-back, contradicting the `parseBracketKey` rules in this change.
>
> Locations: `packages/api-client/src/v2/blocks/request-block/helpers/create-parameter-handlers.ts#L100-L102`

> ### Display marker ignored for array coercion
>
> **Low Severity**
>
> For expanded `deepObject` rows, the table can show a trailing `[]` on the name when the stored leaf value is an array, even if the mapped property schema is not an array. On write-back, `leafSchema` uses `contextRow.schema` whenever it is defined, so the display-only `[]` marker on the row name is not used for comma-to-array coercion. The request can then serialize as a single comma-joined value while the row label implies repeated `key[]=…` entries.
>
> Locations: `packages/api-client/src/v2/blocks/request-block/helpers/create-parameter-handlers.ts#L114-L116`, `packages/api-client/src/v2/blocks/request-block/helpers/create-parameter-rows.ts#L260-L261`

---

## Non-review comments

When the team's usage-based billing cap is hit, Bugbot posts a top-level issue
comment instead of a review and skips the PR entirely:

> ### Bugbot is paused — on-demand spend limit reached
>
> Bugbot uses usage-based billing for this team and has hit its on-demand spend
> limit.
>
> A team admin can raise the spend limit in the Cursor dashboard, or wait for the
> next billing cycle to continue.
