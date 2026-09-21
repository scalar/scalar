# Read-only ESM cold-start research

Issue: [scalar/scalar#9789](https://github.com/scalar/scalar/issues/9789).

## Independent PR measurements

A final comparison uses Node 24.8.0, also refreshes the shared types and schemas, and separates the modal change from highlighting/generators. Other cached-dependency limitations below still apply. Compression sizes can differ between Node/zlib versions, so compare rows within this table rather than mixing runs.

| Build, issue configuration | Requested JS files | Raw bytes | Gzip bytes | Brotli bytes |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 7 | 3,539,764 | 1,033,513 | 853,709 |
| Modal only | 6 | 2,630,676 | 741,170 | 609,746 |
| Highlighting/generators only | 15 | 3,318,525 | 969,179 | 805,769 |

The modal saves **292,343 gzip bytes (28.3%)**; highlighting/generators save **64,334 bytes (6.2%)** independently. The modal implementation retains lightweight workspace-event handlers before the client mounts so server edits, authentication, and client selection remain functional. This makes its saving smaller than simply removing the modal import. Both PRs defer downloads until use; these numbers do not claim that eventual total bytes are removed.

The size harness lives with the highlighting/generators PR. The modal implementation is in a separate PR and is not part of this branch. Measurements named `pr-split-*` retain the fixture and requested-file hashes. They were captured against the original research base; the PRs exclude its two unrelated parser commits and are based directly on main.

## Implemented: on-demand highlighting and generators

The worktree now includes the lazy-loading implementation, preserving the existing synchronous library APIs. The browser UI uses new `@scalar/code-highlight/lazy` and `@scalar/snippetz/lazy` entries plus `generateCodeSnippetAsync` from `@scalar/blocks/code-example`.

A matched comparison rebuilt **snippetz, code-highlight, components, blocks, and api-client from source for both variants**, then built the production ESM reference. The baseline temporarily used HEAD sources; the lazy variant used the worktree changes. Helpers, oas-utils, and workspace-store were also refreshed and held identical across the comparison. Other dependencies remain cached, so this is a controlled local comparison, not yet a clean release/CI baseline.

| Build/configuration | Requested JS files | Raw bytes | Gzip bytes | Brotli bytes | Operation marker, throttled |
| --- | ---: | ---: | ---: | ---: | ---: |
| Matched baseline, issue configuration | 7 | 3,539,632 | 1,027,352 | 853,605 | 7,081 ms |
| Lazy languages and generators, issue configuration | 15 | 3,318,393 | 962,416 | 805,836 | 6,580 ms |
| Lazy build, also hide code samples | 13 | 3,314,454 | 960,625 | 804,286 | Not throttled |

**Savings: 64,936 gzip bytes (6.3%)** for the issue configuration. There are more, smaller requests; the harness does not count HTTP-header overhead. The single timing pair improved by about 501 ms, but repeated runs are needed before claiming a stable timing improvement.

Startup now fetches cURL and JSON support, not every generator and grammar. Selecting Python Requests fetches its generator and grammar afterward (about 4.6 KB gzip). A real browser run asserted the generated Requests sample and highlighted Python spans and captured screenshots. Hiding samples now prevents the cURL generator and grammar downloads, saving another 1,791 gzip bytes.

Implementation details:

- Client-picker metadata is separate from implementations. Tests compare all labels/defaults/order with the synchronous registry and every lazy generator's output with its synchronous counterpart.
- Imports share pending promises; failures clear the loader's cache. Vue's async computations discard stale results after selection changes.
- Snippet request preparation happens before awaiting an import, so nested reactive request edits remain tracked. The picker stays available while generation is pending, with `aria-busy` on its card.
- Code is escaped and Markdown is sanitized synchronously, so content stays readable before highlighting. Language aliases and embedded-language dependencies are retained. Unlabelled Markdown fences and HTTP-body auto-detection load the full registry on demand to preserve existing behavior.
- Existing synchronous `snippetz()`, `generateCodeSnippet()`, `htmlFromMarkdown()`, and `syntaxHighlight()` APIs remain available. Server-rendered async UI can initially show plain code/Markdown and pending generated samples, then enhance on the client.
- The modal still imports on mount. Its approximately 301 KB gzip chunk remains requested; the earlier modal-deferral experiment is a separate next step.

Validation: 1,601 snippetz tests, 128 code-highlight tests, 487 code-example tests (one existing todo), 16 component tests, and five client snippet tests passed. All five modified packages pass type checking. Changed-file lint/format checks and both ESM and UMD builds pass. The no-samples browser run passes a 975,000-byte startup gzip budget. Changesets cover the five modified packages.

The new measurements are saved under `matched-baseline`, `lazy-final`, `lazy-python-interaction`, and `lazy-no-samples` in `measurements.json`. Historical measurements below are retained to distinguish the original cached-build investigation from the matched implementation comparison.

## Initial findings

ESM splitting is enabled, but a dynamic import is only lazy if its caller is lazy. `packages/api-reference/src/components/ApiReference.vue` imports `@scalar/api-client/modal` from `onMounted` whenever its modal element exists. Neither `hideClientButton` nor `hideTestRequestButton` prevents that import. The disabled agent drawer, on the other hand, did not request its chat-interface chunk.

Measurements on 2026-09-21, using the exact issue configuration and a locally frozen Petstore JSON document:

| Build | Requested JS files | Raw bytes | Gzip bytes | Brotli bytes | Operation marker, throttled |
| --- | ---: | ---: | ---: | ---: | ---: |
| Baseline | 7 | 3,524,832 | 1,023,375 | 850,660 | 7,058 ms |
| Skip modal initialization when both buttons are hidden | 6 | 2,585,076 | 724,647 | 600,474 | 6,855 ms |

The experiment saves **298,728 gzip bytes (29.2%)**. It is a proof of the loading boundary, not a production fix. The modal experiment was restored and is not part of the implementation described above. The experiment inserted this guard immediately before the modal import:

```ts
if (mergedConfig.value.hideClientButton && mergedConfig.value.hideTestRequestButton) return
```

There is no convincing first-operation speedup from these single timing samples. Removing the modal mainly avoids asynchronous background startup traffic; the eager rendering graph remains on the critical path. Repeated runs on a controlled machine are required for timing claims.

### Baseline requested files

| Chunk | Gzip bytes |
| --- | ---: |
| `vendor` | 443,603 |
| `modal` | 298,744 |
| `standalone.esm` (includes injected CSS) | 173,581 |
| `ScalarTextInput.vue` | 46,771 |
| `browser` | 31,445 |
| Vue runtime | 28,483 |
| Folder icon | 748 |

The experiment removes only the modal chunk. Shared code remains eager; chunk names alone are not reliable descriptions of their contents. A second configuration with `hiddenClients: true` on the no-modal build still requests exactly 724,647 gzip bytes. Hiding code samples does not currently eliminate their static dependencies.

### Measurement provenance and limits

Commit: `e12fd0245e267a7acb3c5b57e6363fb4265d16aa`. See `measurements.json` for browser version, fixture hash, requested-file hashes, compression sizes, and the two timing runs. Sizes use decimal bytes, not KiB. The harness uses a fresh browser context, disabled cache, no service workers, 1440×1000 viewport, a 2-second observation window, and gzip responses.

**These are preliminary local-build measurements.** The required pnpm 12.2.1 could not be obtained in this environment. The ESM entry was freshly built with Vite 8.1.5 using the existing checkout's linked dependencies and cached workspace `dist` output; upstream packages were not freshly rebuilt. Both checkouts had the same HEAD, but cached artifacts are not guaranteed to match it. Node was v26.3.1 rather than the repository's v24. Before adopting a release/CI budget, rerun after a clean supported install and full dependency build. The fixture was served locally, so public API/CDN latency, HTTP/2 behavior, and actual CDN compression are not measured. The baseline is current local ESM, not the issue's `1.63.0` UMD release.

## Proposed implementation order

### 1. Initialize the API client on demand

Replace mount-time modal initialization with a deduplicated loader triggered by actual client use. Register the lightweight `ui:open:client-modal` listener before loading; await initialization and replay the first event so the first click is not lost. Audit other open paths, keyboard shortcuts, plugin hooks, configuration updates, and unmount-during-load. Retry cleanly after import failure. Preserve API behavior: hiding buttons does not necessarily forbid programmatic client use.

The two-flag guard above demonstrates the savings but does not solve those lifecycle cases. Prefer demand loading across configurations over treating hidden controls as a new disabled-client contract.

Acceptance: no modal request on the read-only page; first client-opening action loads it once and opens the requested operation; concurrent actions and unmounts are handled; full configuration still works. Start with a provisional 750 KB gzip read-only budget after clean-build remeasurement. Measured opportunity here: approximately 299 KB gzip.

### 2. Load syntax-highlighting languages on demand

`packages/components/src/components/ScalarCodeBlock/ScalarCodeBlock.vue` statically imports `standardLanguages`; `packages/code-highlight/src/languages/standard.ts` imports dozens of grammars. Build stats also identify large prebuilt `code-highlight` modules in the eager graph (`markdown`, `lib`, `languages`, `rehype-highlight`). Those module sizes are pre-minification attribution hints, **not additive compressed savings**.

Keep basic JSON/cURL support available for first render, import other grammars when needed, and cache registrations. Preserve Markdown sanitization and rendering; do not defer safety processing. Check fenced Markdown languages as well as sample-language tabs. Audit the code-highlight package build itself so a new async boundary is not defeated by a prebundled shared module.

Acceptance: default Petstore requests only its necessary grammars; switching language loads and highlights correctly; SSR/plain-text fallback remains legible. Measure the eager graph after rebuilding both code-highlight and components. No savings estimate is claimed yet.

### 3. Split snippet generators by selected client

`packages/blocks/src/code-example/helpers/get-snippet.ts` calls the statically imported `snippetz()` registry. `generate-client-options.ts` also imports it to enumerate options. Separate lightweight client metadata from generator implementations. Load only the selected generator, with cached imports and a sensible loading state. Keep cURL ready for the default page if that gives the better first-sample experience.

Acceptance: selecting another client produces the same snippet and requests only its generator; hiding samples prevents generator requests; metadata enumeration does not import all implementations. Measure independently from highlighting because the two have different dependency graphs.

### 4. Reduce the shared rendering graph

`components/Content/Auth/Auth.vue` imports the API client's auth selector; server selectors import `ServerVariablesForm`. The no-modal build still contains `CodeInputLite` and request-auth code. Defer interactive controls until opened, or separate display-only components from editor dependencies while preserving authentication information and server selection behavior.

`packages/workspace-store/src/client.ts` statically imports YAML and AsyncAPI-specific schema/upgrader logic. Investigate JSON-first document loading and format-specific loaders. YAML download is not fully lazy while synchronous store export still imports YAML. Any parser refactor must preserve external references (including YAML references from JSON), version-specific behavior, custom fetch, error reporting, and existing synchronous public APIs. Read the relevant OpenAPI specifications before implementing those changes.

Also audit all-theme CSS injection (`cssCodeSplit: false` plus CSS injection) and theme registration. The entry's CSS remains downloaded even when optional features are unused. Separate feature styles or make a theme-specific delivery path only if it preserves runtime theme changes and avoids flashes of unstyled content.

These changes are broader than modal loading; profile and measure each separately before setting another numerical target.

### 5. Turn the measurement into regression protection

After reproducing on a clean supported build, run at least: the issue's read-only configuration, default interactive configuration, read-only without samples, and a nondefault sample language. Freeze/hash the description. Assert that disabled features do not request their chunks, in addition to a byte budget. Add interaction phases to detect accidental breakage or deferred payload regressions.

Keep deterministic byte budgets as the CI gate. Report medians across multiple isolated cold runs for timing; do not gate on this machine's single-run absolute time. Publish requested versus unrequested chunks and compression settings with every result. Track a separate eventual total after interaction so moving bytes beyond the observation window cannot masquerade as deleting them.
