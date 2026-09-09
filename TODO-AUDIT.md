# TODO audit

Date: 2026-09-08. Base commit: `29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a`.
Worktree: `/private/tmp/scalar-todo-audit`. Branch: `claude/chore-todo-audit`.

## Medium-task follow-up

Completed **T011 and T053** in the same worktree. Together with the previous XS/S work, this closes **18 original inventory entries (17 distinct tasks)**. Counts refer to the original audit, not a fresh count of literal TODO strings in newly added test expectations.

| Entry | Completed change                                                                                                                                                                                                                                                                                             | Verification                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T011  | Enabled the authentication-deletion modal suite. Tests use the real reactive modal state, query the teleported dialog, unmount between tests, and verify opening, warning text, cancellation without deletion, confirmation without cancellation, and closing without deletion.                              | All 119 tests in the authentication-component directory pass, including four restored/expanded modal tests.                                                                                                     |
| T053  | Traverse every variable declaration, extract parameters and responses from inline arrow/function handlers, and preserve each handler's own response status/payload. The shared response generator also understands concise arrow expressions. Existing metadata-only behavior for aliases/factories remains. | All 57 tests across Next.js OpenAPI and TypeScript-to-OpenAPI pass. Nine new cases cover handler forms, JSDoc, parameters, response isolation, equivalence with function declarations, and non-inline handlers. |

This does not expand path parameter extraction beyond the existing inline type-literal format or resolve imported/wrapped handler implementations. Response descriptions still use the existing placeholder; replacing that is the separate remaining task T113 and its related test entries.

### Medium-batch verification

- API Client: **1,809 passing tests** across 106 files; the four modal tests also passed again after correcting the test helper return type.
- Next.js OpenAPI and TypeScript-to-OpenAPI: **57 passing tests** across four files.
- Type checks passed for all three affected packages. Both generator packages built successfully.
- Biome passed for the four changed TypeScript files; the report and changeset were formatted. `pnpm changeset status` and `git diff --check` passed.
- Added `.changeset/complete-medium-todos.md`. Changes remain uncommitted. This batch changes no UI rendering, so the visual artifacts below belong to the earlier small-task batch.

### Remaining work

| Original complexity group | Remaining inventory entries |
| ------------------------- | --------------------------: |
| Trivial (XS)              |                           0 |
| Small (S)                 |                           0 |
| Medium (M)                |                          58 |
| Large (L)                 |                          55 |
| Decision/dependency (D)   |                          10 |
| **Total**                 |                     **123** |

These are inventory entries, including disabled tests and repeated expected-output placeholders, rather than 123 distinct features. Of the remaining entries, **69 are actual TODO comments**: 31 medium, 28 large, and 10 decision/dependency items.

Good candidates for another medium batch:

- **T019 — nested schema composition coverage:** complete the disabled selector-title behavior test against the current renderer.
- **T024 — search operations by tag:** index operation tags, enable the search test, and cover ranking and duplicate matches.
- **T032 — persist selected servers:** store and restore server choices per document alongside existing authentication persistence.
- **T074 — duplicate required properties:** inspect the validator fixture and turn the placeholder into a precise validation assertion.

See the original medium group below for source links, proposed solutions, and scope for all remaining entries. The historical T011/T053 entries are retained for traceability and are superseded by this completion section.

## Implementation follow-up — completed

All **16 XS/S inventory entries (15 distinct tasks)** have been completed in this worktree. The original audit below remains a snapshot of the starting state. Source changes and the patch changeset are uncommitted.

| Entries    | Completed change                                                                                                                                                                                                                    | Verification                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| T020, T022 | Replaced stale schema-reference and display-normalization notes with their current contracts.                                                                                                                                       | API Reference tests and type check.                                                                                        |
| T076, T142 | Removed the obsolete validation comparison TODO and the inactive void-server debugging block.                                                                                                                                       | Validator and void-server tests and type checks.                                                                           |
| T008       | Added the Astro integration default, retaining overrides for static/client rendering. Added Astro render tests and a repeatable `types:check` script using the official checker.                                                    | 24 Astro tests; checker: 13 files, zero errors/warnings/hints.                                                             |
| T009       | Used Docusaurus RouteConfig with Scalar's serialized configuration field; removed the unused speculative id field.                                                                                                                  | 19 tests and integration type check.                                                                                       |
| T026       | The response renderer and copy button share one formatted value. Named, referenced, generated, and falsy examples copy correctly. Fixed the shared selector's early return for falsy values. Added an accessible copy-button label. | 89 focused response tests; workspace-store suite; actual browser clipboard equals the selected second example's JSON.      |
| T035       | Both layout tests now select the same named tag region; existing markup already supports it.                                                                                                                                        | Both modern/classic Playwright cases pass.                                                                                 |
| T041       | Filled the Astro logo with Scalar's existing Astro icon geometry.                                                                                                                                                                   | Components suite and gallery screenshot.                                                                                   |
| T042       | Added sidebar slot-content and accessible-attribute forwarding tests.                                                                                                                                                               | Components suite.                                                                                                          |
| T043       | Styled the draggable playground with Scalar themes/Tailwind, a responsive layout, and instructions.                                                                                                                                 | Build/type check; browser checks for reordering, nesting, moving a group with all six descendants, and no mobile overflow. |
| T054       | Narrowed variable declaration names with isIdentifier before checking HTTP methods.                                                                                                                                                 | Identifier/destructuring regression tests and package type check.                                                          |
| T064, T065 | Enabled meaningful single-file tests with real relative-file, absolute-file, and local-HTTP loading. The original fixture has explicit assertions for resolved pointers and unresolved resource names.                              | 4 focused tests and the complete 276-test parser suite; type check.                                                        |
| T100       | Used TypeScript's isJSDoc guard, preserving the first documentation block and handling absent/empty documentation safely.                                                                                                           | JSDoc regression tests and package type check.                                                                             |
| T158       | Ignored Paths Object extension keys before traversing HTTP methods.                                                                                                                                                                 | Regression with an operation-shaped extension; workspace-store suite and type check.                                       |

The original one-file fixture includes `$id`/anchor resource names that the existing resolver does not resolve. Its limitations are now explicitly tested. Full named-resource/anchor resolution remains the separate large task T059 from the original audit.

### Verification results

| Scope                                     |                             Passing tests |
| ----------------------------------------- | ----------------------------------------: |
| API Reference                             | 1,972 plus 11 network-dependent SSR tests |
| Workspace store                           |                                     2,972 |
| Components                                |                                       553 |
| OpenAPI parser                            |                                       276 |
| OpenAPI validator                         |                                        78 |
| TypeScript-to-OpenAPI and Next.js OpenAPI |                                        48 |
| Void server                               |                                        69 |
| Astro                                     |                                        24 |
| Docusaurus                                |                                        19 |
| Draggable                                 |                                         1 |
| Layout browser tests                      |                                         2 |

Existing skipped/todo tests outside the selected scope remain. SSR tests initially failed because the sandbox could not fetch their external fixtures; all 11 passed when rerun with network access. Local-server tests likewise ran with port-binding permission. The final response-focused suite passed after the last shared-content adjustment.

Scoped package type checks passed, including Astro's own checker for `.astro` files. Biome and ESLint passed on changed source files; supported files were formatted with Prettier. The final API Reference and draggable builds passed. `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm changeset status`, and `git diff --check` passed. The lockfile adds the checker dependency tree and playground tooling while preserving unrelated dependency versions. The initial full package build supplied the required upstream artifacts; API Reference was rebuilt after the final edits.

### Visual evidence

- [Draggable before](./todo-audit-artifacts/draggable_before.png)
- [Draggable after](./todo-audit-artifacts/draggable_after.png)
- [Nested/group dragging](./todo-audit-artifacts/draggable_nested.png)
- [Mobile layout](./todo-audit-artifacts/draggable_mobile.png)
- [Restored Astro logo](./todo-audit-artifacts/astro_logo_after.png)
- [Selected response example](./todo-audit-artifacts/response_example_after.png)
- [Response example in context](./todo-audit-artifacts/response_example_context.png)

## Original audit

The following recommendations and estimates describe the starting state, before the implementation above.

## Best places to start

Start with the three comment cleanups below, then Astro attribution and the Next.js type guard. For a visible bug fix, choose response-example copying. Estimates include focused verification but exclude initial dependency builds and PR turnaround.

| Priority | Candidate                                   | Estimate  | Evidence and completion criterion                                                                                                                    |
| -------- | ------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Obsolete void-server debugging block (T142) | 15 min    | The alternate raw-body assignment is already commented out. Remove the three stale comment lines and preserve active parsing.                        |
| 2        | Schema normalization explanation (T022)     | 20–40 min | Detailed implementation comments and adjacent tests now explain it. Replace the uncertainty with its actual display-normalization contract.          |
| 3        | Stale schema-reference test request (T020)  | 20–40 min | get-ref-name.test.ts already tests both helpers. Retire the vague future note and the instruction to add tests.                                      |
| 4        | Astro integration attribution (T008)        | 30–90 min | Both shared type and configuration schema already accept astro. Set the default and verify the serialized result/override.                           |
| 5        | Next.js identifier cast (T054)              | 1–2 h     | isIdentifier is already imported. Guard the declaration name before checking the HTTP method, including a destructuring regression.                  |
| 6        | Paths Object extension filtering (T158)     | 1–3 h     | Only HTTP methods are filtered today. Ignore extension keys before traversing their object contents and cover a get-shaped extension.                |
| 7        | Response example copy button (T026)         | 2–4 h     | The button reads currentResponseContent.example; the renderer reads currentExample. Make copying use the same resolved, formatted text as rendering. |
| 8        | Sidebar behavior coverage (T042)            | 1–2 h     | A small aside/slot wrapper has only an existence assertion. Cover slot content and accessible attribute forwarding.                                  |

The first three remove **3 TODOs in roughly 1–2 hours**, with no intended behavior change. Adding Astro and the identifier guard gives a plausible five-item first batch of roughly **3–5 hours** after setup. These are estimates from source inspection, not measured implementations. T076 is another tiny comment cleanup, but offers less value.

## Scope and confidence

Scanned every tracked text file at the base commit for case-insensitive whole-word TODO markers, including dotfiles. Used a tracked-file listing and source reads so ignored/untracked files, dependencies, other worktrees, and this report do not enter the inventory. Symlink aliases are not double-counted. The broad scan also found translations, fixture names, output strings, and test declarations; those are explicitly distinguished below. This is a TODO audit, not an inventory of every FIXME, HACK, or skipped test.

There are **160 matching tracked source lines**, excluding the duplicate CLAUDE.md symlink target. Of these, **141 actionable/backlog markers** are classified below and **19 lines** are non-task matches. Each matching line is an occurrence, not necessarily a separate task. Linked duplicate markers share the same proposed solution. IDs preserve scan order, so excluded matches leave gaps.

Source excerpts and nearby code were inspected for each task area, with deeper tracing for the shortlist. Estimates remain provisional: disabled tests were not enabled or run, external issue status was not checked, and suggested fixes were not implemented. Large/broad TODOs need decomposition. The decision group is not automatically easy or hard.

| Marker kind                  | Occurrences |
| ---------------------------- | ----------: |
| TODO comment                 |          84 |
| Disabled test marker         |          21 |
| Visible placeholder          |           1 |
| Output/test placeholder      |          17 |
| Commented output placeholder |          18 |

## Complexity summary

| Group                                                         | TODO comments | All backlog markers |
| ------------------------------------------------------------- | ------------: | ------------------: |
| XS — cleanup (15–60 minutes)                                  |             4 |                   4 |
| S — small change (about 1–4 hours)                            |            10 |                  12 |
| M — focused implementation (about 0.5–2 days)                 |            32 |                  60 |
| L — substantial work (2+ days)                                |            28 |                  55 |
| Decision or dependency first — estimate after resolving scope |            10 |                  10 |
| Total                                                         |            84 |                 141 |

Counts include repeated placeholder outputs and disabled-test markers. In particular, the ten snippet converters are ten separate implementations; repeated response-description expectations point to one implementation. The TypeScript generator contains many repeated placeholder strings for a smaller set of unsupported features.

## Complete classified inventory

Every entry gives the original matching line, a source link pinned to the audited commit, and a proposed resolution with the key verification or uncertainty. Multi-line umbrella TODOs are expanded in their proposed solution.

### XS — cleanup (15–60 minutes)

#### T020 — packages/api-reference/src/components/Content/Schema/helpers/get-ref-name.ts:5

[packages/api-reference/src/components/Content/Schema/helpers/get-ref-name.ts:5](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/components/Content/Schema/helpers/get-ref-name.ts#L5) · TODO comment

```text
* TODO: this will change so fix it when the new refs are out
```

Replace the vague future-ref note and Then add tests line with the current contract. get-ref-name.test.ts already covers local, external, and empty refs; preserve the distinction between getRefName and getSchemaRefName. No reference algorithm change is required for this cleanup.

#### T022 — packages/api-reference/src/components/Content/Schema/helpers/optimize-value-for-display.ts:58

[packages/api-reference/src/components/Content/Schema/helpers/optimize-value-for-display.ts:58](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/components/Content/Schema/helpers/optimize-value-for-display.ts#L58) · TODO comment

```text
* TODO: figure out what this does
```

Replace figure out what this does with a concise explanation of display-only normalization: remove null branches, preserve nullable state, flatten single branches, and merge shared properties/required. The implementation and adjacent optimize-value-for-display.test.ts already document these behaviors; preserve the algorithm.

#### T076 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/license_identifier.test.ts:10

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/license_identifier.test.ts:10](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/license_identifier.test.ts#L10) · TODO comment

```text
// TODO: Swagger Editor
```

Replace the bare TODO: Swagger Editor label with an explanatory comparison comment, or remove the obsolete comparison. The test already asserts Property identifier is not expected to be here and invalidity; no missing implementation is identified by this marker.

#### T142 — packages/void-server/src/utils/get-body.ts:12

[packages/void-server/src/utils/get-body.ts:12](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/void-server/src/utils/get-body.ts#L12) · TODO comment

```text
// TODO: This is just for debugging purposes, remove it later
```

Delete the obsolete three-line debugging comment block above transformFormData. The raw-body assignment is already commented out and parseBody is already active; retain all runtime parsing unchanged.

### S — small change (about 1–4 hours)

#### T008 — integrations/astro/src/ScalarComponent.astro:25

[integrations/astro/src/ScalarComponent.astro:25](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/integrations/astro/src/ScalarComponent.astro#L25) · TODO comment

```text
// TODO :Add the integration name to the configuration once the first release went out to allow the value
```

Enable \_integration: astro in DEFAULT_CONFIGURATION and remove the release-gated comment. Both packages/types/src/api-reference/types.ts and base-configuration.ts already allow astro. Verify rendered HTML defaults to astro and explicit configuration still overrides it.

#### T009 — integrations/docusaurus/src/ScalarDocusaurus.tsx:15

[integrations/docusaurus/src/ScalarDocusaurus.tsx:15](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/integrations/docusaurus/src/ScalarDocusaurus.tsx#L15) · TODO comment

```text
/** Not sure where the route type is for docusaurus, couldn't find one with an ID, TODO: replace with that */
```

Inspect the installed Docusaurus route types. Use the public route type plus a local intersection for the plugin-injected id if needed; if id is purely custom, document the local shape and remove the speculative TODO. Type-check the integration.

#### T026 — packages/api-reference/src/features/example-responses/ExampleResponses.vue:32

[packages/api-reference/src/features/example-responses/ExampleResponses.vue:32](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/features/example-responses/ExampleResponses.vue#L32) · TODO comment

```text
* TODO: copyToClipboard isn't using the right content if there are multiple examples
```

Derive the action-button clipboard text from the same resolved, pretty-printed content as ExampleResponse. Its current handler and visibility read currentResponseContent.example, while rendering uses currentExample. Cover selecting the second named example, refs, 0/false/empty values, generated examples, and changing response status. Estimated 2–4 hours; shared formatting avoids a second divergent implementation.

#### T035 — packages/api-reference/test/configuration/layout.e2e.ts:53

[packages/api-reference/test/configuration/layout.e2e.ts:53](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/test/configuration/layout.e2e.ts#L53) · TODO comment

```text
// TODO: Ideally, we'd have the same 'region' selector for both layouts.
```

Use an existing equivalent accessible region in both layouts, or add a correctly labelled region where missing, then replace the class selector. Run both layout E2E cases and inspect landmark semantics.

#### T041 — packages/components/src/components/ScalarIcon/logos/Astro.svg:2

[packages/components/src/components/ScalarIcon/logos/Astro.svg:2](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/components/src/components/ScalarIcon/logos/Astro.svg#L2) · TODO comment

```text
<!-- TODO -->
```

Populate the empty Astro SVG using the established icon source/system after checking provenance. Astro is still listed in logos/index.ts, so deleting its name would remove a public option. Preview at normal icon size; this requires an actual asset, not deleting its TODO.

#### T042 — packages/components/src/components/ScalarSidebar/ScalarSidebar.test.ts:12

[packages/components/src/components/ScalarSidebar/ScalarSidebar.test.ts:12](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/components/src/components/ScalarSidebar/ScalarSidebar.test.ts#L12) · TODO comment

```text
// TODO: Add more tests
```

Add behavior tests for default-slot content and forwarded accessible attributes on ScalarSidebar. It is a small aside wrapper and currently tests only existence. Avoid assertions on Tailwind classes.

#### T043 — packages/draggable/playground/App.vue:90

[packages/draggable/playground/App.vue:90](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/draggable/playground/App.vue#L90) · Visible placeholder

```text
<div>#TODO make this pretty :)</div>
```

Replace the visible playground TODO with an intentional demo layout and useful drag instructions using existing styling conventions. Verify dragging still works and capture the playground visually.

#### T054 — packages/nextjs-openapi/src/path.ts:95

[packages/nextjs-openapi/src/path.ts:95](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/nextjs-openapi/src/path.ts#L95) · TODO comment

```text
// TODO: Remove this typecast. It looks totally incompatible
```

Read the first declaration name into a local, guard name && isIdentifier(name), then pass the narrowed name to checkForMethod. isIdentifier is already imported. Test a normal GET export and destructuring; full variable-handler support remains a separate TODO.

#### T064 — packages/openapi-parser/tests/references/one-file/one-file.test.ts:9

[packages/openapi-parser/tests/references/one-file/one-file.test.ts:9](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-parser/tests/references/one-file/one-file.test.ts#L9) · Disabled test marker

```text
describe.todo('one-file', () => {
```

Complete the one-file test suite with exact resolved target assertions for local references and meaningful file/URL cases; use controlled fixtures. Replace the defined-only assertion and enable the suite. One task has both a suite marker and a comment; resolution failures could raise its complexity.

#### T065 — packages/openapi-parser/tests/references/one-file/one-file.test.ts:14

[packages/openapi-parser/tests/references/one-file/one-file.test.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-parser/tests/references/one-file/one-file.test.ts#L14) · TODO comment

```text
// TODO: Expectation
```

Complete the one-file test suite with exact resolved target assertions for local references and meaningful file/URL cases; use controlled fixtures. Replace the defined-only assertion and enable the suite. One task has both a suite marker and a comment; resolution failures could raise its complexity.

#### T100 — packages/ts-to-openapi/src/js-doc.ts:15

[packages/ts-to-openapi/src/js-doc.ts:15](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/js-doc.ts#L15) · TODO comment

```text
// Check for jsDoc - todo properly narrow type using typescript lib
```

Replace unchecked node.jsDoc[0] access with a typed JSDoc helper and handle no docs/empty docs. Preserve the existing title/description contract and test multiple comments; returning all tags remains separate.

#### T158 — packages/workspace-store/src/server.ts:150

[packages/workspace-store/src/server.ts:150](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/server.ts#L150) · TODO comment

```text
// Todo: skip extension properties
```

Skip Paths Object extension keys before iterating path items (for example x-metadata). Method filtering already exists inside each item, but an extension object containing a get key can still resemble a path. Test that extension plus a legitimate path and a path-item-level extension.

### M — focused implementation (about 0.5–2 days)

#### T003 — .prettierignore:12

[.prettierignore:12](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/.prettierignore#L12) · TODO comment

```text
# TODO: [error] [prettier-plugin-sort-imports]: import sorting aborted due to babel parsing error.
```

Reproduce Markdown/MDX import-sort parsing with the installed formatter; use parser-specific overrides and then narrow the ignore. Check representative fenced code and MDX before enabling formatting repository-wide.

#### T006 — documentation/assets/styles.css:122

[documentation/assets/styles.css:122](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/documentation/assets/styles.css#L122) · TODO comment

```text
/* TODO: Remove these styles after cleaning up the docs pages */
```

Identify documentation pages still using the legacy t-editor selectors, migrate those pages, then remove only unused rules. Compare rendered documentation before and after.

#### T007 — examples/web/src/pages/StandaloneApiReferencePage.vue:20

[examples/web/src/pages/StandaloneApiReferencePage.vue:20](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/examples/web/src/pages/StandaloneApiReferencePage.vue#L20) · TODO comment

```text
// @ts-expect-error TODO: types are wrong here
```

Trace standalone source configuration versus global layout typing; decide whether per-source layout is supported, then align the example and configuration types. Type-check the example and exercise source switching.

#### T010 — packages/api-client-react/src/lazy-load.ts:63

[packages/api-client-react/src/lazy-load.ts:63](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-client-react/src/lazy-load.ts#L63) · TODO comment

```text
// TODO: map plugins from configuration when available
```

Locate the current configuration-to-plugin mapper and wire it into createModal with the right lifecycle. Verify a configured plugin runs and loading/unmounting does not register it twice.

#### T011 — packages/api-client/src/v2/blocks/scalar-auth-selector-block/components/DeleteRequestAuthModal.test.ts:6

[packages/api-client/src/v2/blocks/scalar-auth-selector-block/components/DeleteRequestAuthModal.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-client/src/v2/blocks/scalar-auth-selector-block/components/DeleteRequestAuthModal.test.ts#L6) · Disabled test marker

```text
describe.todo('DeleteRequestAuthModal', () => {
```

Run the disabled suite against the current modal, update stale props/events and modal mounting/teleport cleanup, then enable it. Verify cancel, confirm, and visibility; do not assume removing .todo alone is sufficient.

#### T013 — packages/api-reference/src/components/ApiReference.ssr.test.ts:97

[packages/api-reference/src/components/ApiReference.ssr.test.ts:97](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/components/ApiReference.ssr.test.ts#L97) · TODO comment

```text
// TODO: In the future, we should fix the warnings.
```

Capture the SSR warnings, fix their originating components or providers, and restore the warn assertion without broadly silencing console output. Run SSR and hydration coverage.

#### T017 — packages/api-reference/src/components/ApiReference.vue:1882

[packages/api-reference/src/components/ApiReference.vue:1882](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/components/ApiReference.vue#L1882) · TODO comment

```text
<!-- TODO: Remove this; we no longer directly support an inline editor -->
```

Search public slot/configuration consumers of isEditable and editor-placeholder, then remove obsolete empty-state wiring if compatibility permits. Validate classic/modern empty states; public slots make this more than comment cleanup.

#### T018 — packages/api-reference/src/components/ApiReference.vue:2075

[packages/api-reference/src/components/ApiReference.vue:2075](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/components/ApiReference.vue#L2075) · TODO comment

```text
* TODO: @brynn move this to the sidebar block OR the ApiReferenceStandalone component
```

Move the mobile header-height rule to the component that owns standalone layout once it owns the required selectors. Check classic/modern, desktop/mobile, and embedded references visually.

#### T019 — packages/api-reference/src/components/Content/Schema/SchemaProperty.test.ts:984

[packages/api-reference/src/components/Content/Schema/SchemaProperty.test.ts:984](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/components/Content/Schema/SchemaProperty.test.ts#L984) · Disabled test marker

```text
it.todo('renders nested composition selectors with correct titles', async () => {
```

Compare disabled assertions with the current schema composition UI, rewrite them around user-visible nested selector titles, and enable coverage. Fix rendering only if the updated behavioral expectations fail.

#### T021 — packages/api-reference/src/components/Content/Schema/helpers/get-schema-type.ts:62

[packages/api-reference/src/components/Content/Schema/helpers/get-schema-type.ts:62](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/components/Content/Schema/helpers/get-schema-type.ts#L62) · TODO comment

```text
// TODO: Correctly type array of types in SchemaObject
```

Represent union types containing array and items accurately in the shared SchemaObject model, or narrow the object with a proper guard. Check callers and mixed array/null/scalar display tests before removing casts.

#### T023 — packages/api-reference/src/features/Search/components/SearchButton.vue:74

[packages/api-reference/src/features/Search/components/SearchButton.vue:74](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/features/Search/components/SearchButton.vue#L74) · TODO comment

```text
// TODO: we can move this to the hotkey event bus but we would need to set up a custom key from the searchHotKey config
```

Register the configurable search shortcut with the workspace hotkey bus and clean it up on unmount/config changes. Verify custom keys, editable inputs, multiple instances, and modal contexts.

#### T024 — packages/api-reference/src/features/Search/search-quality.test.ts:160

[packages/api-reference/src/features/Search/search-quality.test.ts:160](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/features/Search/search-quality.test.ts#L160) · Disabled test marker

```text
it.todo('finds operations by tag', () => {
```

Include operation tag names in the search index and enable the tag-query test. Check ranking and duplicate operations when matching both tags and text.

#### T025 — packages/api-reference/src/features/Search/search-quality.test.ts:481

[packages/api-reference/src/features/Search/search-quality.test.ts:481](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/features/Search/search-quality.test.ts#L481) · Disabled test marker

```text
it.todo('handles complex nested schemas', () => {
```

Index nested schema property text with cycle protection and bounded traversal, then enable the nested-address test. Check recursion and large-document search cost.

#### T032 — packages/api-reference/src/plugins/persistence-plugin.ts:54

[packages/api-reference/src/plugins/persistence-plugin.ts:54](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/plugins/persistence-plugin.ts#L54) · TODO comment

```text
// Persist auth and [server](TODO)
```

Define server-selection persistence policy and storage shape, handle server events keyed by document, and restore only valid selections. Test document switching and stale server URLs alongside auth persistence.

#### T033 — packages/api-reference/src/standalone.bench.ts:18

[packages/api-reference/src/standalone.bench.ts:18](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/standalone.bench.ts#L18) · TODO comment

```text
// TODO: we should option in disabling lazy loading
```

Define whether the benchmark measures initial render or fully materialized content; expose a test-only eager path or await all required content accordingly. Keep benchmark comparisons measuring the same workload.

#### T037 — packages/blocks/src/code-example/components/CodeExample.test.ts:1104

[packages/blocks/src/code-example/components/CodeExample.test.ts:1104](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/blocks/src/code-example/components/CodeExample.test.ts#L1104) · TODO comment

```text
// TODO: https://github.com/scalar/scalar/pull/6670
```

Use the adjacent text/plain webhook fixture to reproduce payload generation, respect the selected request MIME type through operation-to-HAR and display, then enable the test. These two markers describe one task; the historical PR was not consulted.

#### T038 — packages/blocks/src/code-example/components/CodeExample.test.ts:1105

[packages/blocks/src/code-example/components/CodeExample.test.ts:1105](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/blocks/src/code-example/components/CodeExample.test.ts#L1105) · Disabled test marker

```text
it.todo('generates webhook payload for different content types', () => {
```

Use the adjacent text/plain webhook fixture to reproduce payload generation, respect the selected request MIME type through operation-to-HAR and display, then enable the test. These two markers describe one task; the historical PR was not consulted.

#### T039 — packages/blocks/src/code-example/helpers/get-snippet.ts:39

[packages/blocks/src/code-example/helpers/get-snippet.ts:39](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/blocks/src/code-example/helpers/get-snippet.ts#L39) · TODO comment

```text
// TODO: Fix this, use js (instead of javascript) everywhere
```

Choose js as internal canonical target while preserving javascript at compatibility boundaries. Update target maps and callers together; verify persisted client selections and generated snippets still work.

#### T040 — packages/blocks/src/code-example/helpers/operation-to-har/process-security-schemes.ts:14

[packages/blocks/src/code-example/helpers/operation-to-har/process-security-schemes.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/blocks/src/code-example/helpers/operation-to-har/process-security-schemes.ts#L14) · TODO comment

```text
* TODO: we probably want to be able to disable YOUR_SECRET_TOKEN placeholder text + or allow it to be customzied
```

Add a documented placeholder policy to security-scheme processing and thread it through callers. Preserve current defaults; test unset versus intentionally empty tokens and each authentication placement.

#### T053 — packages/nextjs-openapi/src/path.ts:93

[packages/nextjs-openapi/src/path.ts:93](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/nextjs-openapi/src/path.ts#L93) · TODO comment

```text
// TODO: variables
```

Traverse all supported exported variable declarations and arrow/function initializers, extracting path parameters and responses consistently with function declarations. Cover multiple declarations and unsupported binding patterns.

#### T055 — packages/object-utils/src/mutator-record/mutations.test.ts:149

[packages/object-utils/src/mutator-record/mutations.test.ts:149](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/object-utils/src/mutator-record/mutations.test.ts#L149) · TODO comment

```text
// TODO: This test fails way too often, there seems to be a race condition.
```

Isolate mutable state per test and inspect mutation history scheduling/order. Remove retries and enable rollback/roll-forward coverage only once repeated focused runs establish deterministic behavior.

#### T057 — packages/openapi-parser/src/utils/dereference.test.ts:215

[packages/openapi-parser/src/utils/dereference.test.ts:215](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-parser/src/utils/dereference.test.ts#L215) · TODO comment

```text
// TODO: This is valid in @apidevtools/swagger, but not with our implementation
```

Reproduce the specific dereference fixture, identify the rejected reference/schema shape, and add a focused expected result before changing resolution. An implementation comparison in a comment alone does not establish desired semantics.

#### T060 — packages/openapi-parser/src/utils/upgrade.ts:22

[packages/openapi-parser/src/utils/upgrade.ts:22](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-parser/src/utils/upgrade.ts#L22) · TODO comment

```text
// TODO: Run upgrade over the whole filesystem
```

Upgrade each document in a Filesystem while preserving filenames, entrypoint metadata, and inter-file refs. Test mixed source versions and external files, then return a coherent upgraded filesystem/result.

#### T068 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/OAI/OAI.test.ts:6

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/OAI/OAI.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/OAI/OAI.test.ts#L6) · TODO comment

```text
// TODO: The example is in the `fail` folder, but I don't know why it's supposed to fail.
```

Load the YAML as raw text, establish the actual invalid condition, and assert a meaningful parser/validation error. If the fixture is valid, reclassify it with a valid expectation. Do not enable the placeholder something went wrong assertion.

#### T069 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/OAI/OAI.test.ts:8

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/OAI/OAI.test.ts:8](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/OAI/OAI.test.ts#L8) · Disabled test marker

```text
describe.todo('OAI', () => {
```

Load the YAML as raw text, establish the actual invalid condition, and assert a meaningful parser/validation error. If the fixture is valid, reclassify it with a valid expectation. Do not enable the placeholder something went wrong assertion.

#### T070 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/deprecated2.test.ts:6

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/deprecated2.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/deprecated2.test.ts#L6) · Disabled test marker

```text
describe.todo('deprecated2', () => {
```

Inspect each deprecated fixture and decide whether its invalidity is structural or merely a lint concern. Replace placeholder errors with the supported validation outcome and enable separately for each fixture.

#### T071 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/deprecated3.test.ts:6

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/deprecated3.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/deprecated3.test.ts#L6) · Disabled test marker

```text
describe.todo('deprecated3', () => {
```

Inspect each deprecated fixture and decide whether its invalidity is structural or merely a lint concern. Replace placeholder errors with the supported validation outcome and enable separately for each fixture.

#### T072 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/duplicateOperationId.test.ts:6

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/duplicateOperationId.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/duplicateOperationId.test.ts#L6) · Disabled test marker

```text
describe.todo('duplicateOperationId', () => {
```

Add document-wide operationId uniqueness checking with a useful location for duplicates, then replace the placeholder assertion and enable the test.

#### T073 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/duplicateParameter.test.ts:6

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/duplicateParameter.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/duplicateParameter.test.ts#L6) · Disabled test marker

```text
describe.todo('duplicateParameter', () => {
```

Validate parameter uniqueness by the pair name/in at the relevant operation/path scope, respecting override semantics. Enable the fixture with a precise duplicate error.

#### T074 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/duplicateRequired.test.ts:6

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/duplicateRequired.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/duplicateRequired.test.ts#L6) · Disabled test marker

```text
describe.todo('duplicateRequired', () => {
```

Validate uniqueness of required-property names through the schema validator and assert the offending location, then enable the fixture. First determine whether the underlying validator already catches it.

#### T075 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/internalPathItemRef.test.ts:6

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/internalPathItemRef.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/internalPathItemRef.test.ts#L6) · Disabled test marker

```text
describe.todo('internalPathItemRef', () => {
```

Determine whether the internal Path Item ref fixture is valid and make assertions match its resolved shape or real error. All meaningful assertions are currently commented out; merely enabling it adds little coverage.

#### T077 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/missingPathItemRef.test.ts:6

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/missingPathItemRef.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/missingPathItemRef.test.ts#L6) · Disabled test marker

```text
describe.todo('missingPathItemRef', () => {
```

Ensure unresolved Path Item refs yield a location-aware resolver error and invalidate the document, then replace the placeholder error and enable the suite. Both markers describe the same missing coverage.

#### T078 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/missingPathItemRef.test.ts:10

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/missingPathItemRef.test.ts:10](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/missingPathItemRef.test.ts#L10) · TODO comment

```text
// TODO: Swagger Editor
```

Ensure unresolved Path Item refs yield a location-aware resolver error and invalidate the document, then replace the placeholder error and enable the suite. Both markers describe the same missing coverage.

#### T079 — packages/openapi-validator/tests/openapi3-examples/3.0/fail/serverVariableEnumType.test.ts:10

[packages/openapi-validator/tests/openapi3-examples/3.0/fail/serverVariableEnumType.test.ts:10](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/fail/serverVariableEnumType.test.ts#L10) · TODO comment

```text
// TODO: Swagger Editor has a better error message
```

Improve validation diagnostics with the server-variable enum item location while preserving the type error. Assert the structured path plus message rather than copying another editor wording blindly.

#### T080 — packages/openapi-validator/tests/openapi3-examples/3.0/pass/server_enum_empty.test.ts:6

[packages/openapi-validator/tests/openapi3-examples/3.0/pass/server_enum_empty.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/pass/server_enum_empty.test.ts#L6) · Disabled test marker

```text
describe.todo('server_enum_empty', () => {
```

Resolve the empty enum fixture expectation against its declared OpenAPI version, then move it if necessary and enable the correct valid/invalid assertion. Do not trust its pass directory as the contract.

#### T081 — packages/openapi-validator/tests/openapi3-examples/3.0/pass/server_enum_unknown.test.ts:6

[packages/openapi-validator/tests/openapi3-examples/3.0/pass/server_enum_unknown.test.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.0/pass/server_enum_unknown.test.ts#L6) · Disabled test marker

```text
describe.todo('server_enum_unknown', () => {
```

Validate server variable defaults against enum values per supported OpenAPI version; replace placeholder/missing messages and enable each fixture. The 3.0 pass-file test already expects invalidity, so reconcile naming as part of the work.

#### T082 — packages/openapi-validator/tests/openapi3-examples/3.1/fail/server_enum_unknown.test.ts:7

[packages/openapi-validator/tests/openapi3-examples/3.1/fail/server_enum_unknown.test.ts:7](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.1/fail/server_enum_unknown.test.ts#L7) · Disabled test marker

```text
it.todo('returns an error', async () => {
```

Validate server variable defaults against enum values per supported OpenAPI version; replace placeholder/missing messages and enable each fixture. The 3.0 pass-file test already expects invalidity, so reconcile naming as part of the work.

#### T083 — packages/openapi-validator/tests/openapi3-examples/3.1/fail/server_enum_unknown.test.ts:10

[packages/openapi-validator/tests/openapi3-examples/3.1/fail/server_enum_unknown.test.ts:10](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.1/fail/server_enum_unknown.test.ts#L10) · TODO comment

```text
// TODO: The message should return something related to the unknown enum value
```

Validate server variable defaults against enum values per supported OpenAPI version; replace placeholder/missing messages and enable each fixture. The 3.0 pass-file test already expects invalidity, so reconcile naming as part of the work.

#### T085 — packages/openapi-validator/tests/openapi3-examples/3.2/fail/server_enum_unknown.test.ts:7

[packages/openapi-validator/tests/openapi3-examples/3.2/fail/server_enum_unknown.test.ts:7](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.2/fail/server_enum_unknown.test.ts#L7) · Disabled test marker

```text
it.todo('returns an error', async () => {
```

Validate server variable defaults against enum values per supported OpenAPI version; replace placeholder/missing messages and enable each fixture. The 3.0 pass-file test already expects invalidity, so reconcile naming as part of the work.

#### T086 — packages/openapi-validator/tests/openapi3-examples/3.2/fail/server_enum_unknown.test.ts:10

[packages/openapi-validator/tests/openapi3-examples/3.2/fail/server_enum_unknown.test.ts:10](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.2/fail/server_enum_unknown.test.ts#L10) · TODO comment

```text
// TODO: The message should return something related to the unknown enum value
```

Validate server variable defaults against enum values per supported OpenAPI version; replace placeholder/missing messages and enable each fixture. The 3.0 pass-file test already expects invalidity, so reconcile naming as part of the work.

#### T084 — packages/openapi-validator/tests/openapi3-examples/3.1/fail/unknown_container.test.ts:10

[packages/openapi-validator/tests/openapi3-examples/3.1/fail/unknown_container.test.ts:10](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.1/fail/unknown_container.test.ts#L10) · TODO comment

```text
// TODO: The message should complain about the unknown container
```

Report unexpected top-level containers with their location while retaining required-field errors. Check whether the fixtures contain several independent errors before replacing the existing expectations.

#### T087 — packages/openapi-validator/tests/openapi3-examples/3.2/fail/unknown_container.test.ts:10

[packages/openapi-validator/tests/openapi3-examples/3.2/fail/unknown_container.test.ts:10](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-validator/tests/openapi3-examples/3.2/fail/unknown_container.test.ts#L10) · TODO comment

```text
// TODO: The message should complain about the unknown container
```

Report unexpected top-level containers with their location while retaining required-field errors. Check whether the fixtures contain several independent errors before replacing the existing expectations.

#### T088 — packages/pre-post-request-scripts/src/consts/example-scripts.ts:23

[packages/pre-post-request-scripts/src/consts/example-scripts.ts:23](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/pre-post-request-scripts/src/consts/example-scripts.ts#L23) · TODO comment

```text
// TODO: We didn't add the proper response duration yet.
```

Propagate actual request elapsed time into the Postman response context, supply it in the example fixture, and restore the timing example. Existing test-result duration measures script assertions, not HTTP responseTime.

#### T099 — packages/ts-to-openapi/src/js-doc.ts:6

[packages/ts-to-openapi/src/js-doc.ts:6](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/js-doc.ts#L6) · TODO comment

```text
* TODO:
```

Use TypeScript JSDoc helper APIs to collect comments/tags safely, define the public representation of all tags, and migrate consumers. Preserve summary/description precedence and handle structured comment text.

#### T102 — packages/ts-to-openapi/src/responses.test.ts:48

[packages/ts-to-openapi/src/responses.test.ts:48](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.test.ts#L48) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T103 — packages/ts-to-openapi/src/responses.test.ts:61

[packages/ts-to-openapi/src/responses.test.ts:61](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.test.ts#L61) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T104 — packages/ts-to-openapi/src/responses.test.ts:104

[packages/ts-to-openapi/src/responses.test.ts:104](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.test.ts#L104) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T105 — packages/ts-to-openapi/src/responses.test.ts:117

[packages/ts-to-openapi/src/responses.test.ts:117](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.test.ts#L117) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T106 — packages/ts-to-openapi/src/responses.test.ts:130

[packages/ts-to-openapi/src/responses.test.ts:130](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.test.ts#L130) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T107 — packages/ts-to-openapi/src/responses.test.ts:143

[packages/ts-to-openapi/src/responses.test.ts:143](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.test.ts#L143) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T108 — packages/ts-to-openapi/src/responses.test.ts:156

[packages/ts-to-openapi/src/responses.test.ts:156](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.test.ts#L156) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T109 — packages/ts-to-openapi/src/responses.test.ts:173

[packages/ts-to-openapi/src/responses.test.ts:173](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.test.ts#L173) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T110 — packages/ts-to-openapi/src/responses.test.ts:186

[packages/ts-to-openapi/src/responses.test.ts:186](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.test.ts#L186) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T111 — packages/ts-to-openapi/src/responses.test.ts:199

[packages/ts-to-openapi/src/responses.test.ts:199](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.test.ts#L199) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T113 — packages/ts-to-openapi/src/responses.ts:122

[packages/ts-to-openapi/src/responses.ts:122](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.ts#L122) · Output/test placeholder

```text
description: 'TODO: grab this from jsdoc and add a default',
```

Replace the response description placeholder in responses.ts with extracted JSDoc or an intentional default, then update these exact expected outputs. These repetitions are one production fix, not eleven separate tasks.

#### T140 — packages/validation/src/coerce.ts:122

[packages/validation/src/coerce.ts:122](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/validation/src/coerce.ts#L122) · TODO comment

```text
// TODO: implement smarter scoring for records (just a placeholder for now)
```

Score records by how well keys and values match their schemas instead of treating every object equally. Define empty-record/tie behavior and test overlapping union branches, recursion, and scoring cost.

#### T141 — packages/validation/src/validate.test.ts:560

[packages/validation/src/validate.test.ts:560](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/validation/src/validate.test.ts#L560) · TODO comment

```text
// TODO: implement this
```

Define number-key validation for JavaScript stringified object keys, then extend record typing and runtime validation together. Enable the skipped numeric-key case and test malformed numeric strings.

#### T157 — packages/workspace-store/src/navigation/helpers/traverse-paths.ts:96

[packages/workspace-store/src/navigation/helpers/traverse-paths.ts:96](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/navigation/helpers/traverse-paths.ts#L96) · TODO comment

```text
* TODO: filter out internal and scalar-ignore tags
```

Apply the existing hidden-item policy to tag groups as well as operations. Decide how operations with both visible/hidden tags or only hidden tags appear, then test navigation output and stable IDs.

#### T159 — projects/scalar-app/src/features/app/hooks/use-sidebar-documents/index.ts:67

[projects/scalar-app/src/features/app/hooks/use-sidebar-documents/index.ts:67](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/projects/scalar-app/src/features/app/hooks/use-sidebar-documents/index.ts#L67) · TODO comment

```text
// TODO: we can implement this later
```

Derive isPinned from document metadata and preserve it when grouping registry versions; connect existing pin mutations/persistence or implement that flow if absent. Test pin/unpin and reload. Reading a boolean alone may leave an unusable feature.

#### T160 — projects/scalar-app/src/features/app/hooks/use-sidebar-documents/types.ts:80

[projects/scalar-app/src/features/app/hooks/use-sidebar-documents/types.ts:80](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/projects/scalar-app/src/features/app/hooks/use-sidebar-documents/types.ts#L80) · TODO comment

```text
/** Whether the document is pinned (todo: derived from `x-scalar-pinned`) */
```

Derive isPinned from document metadata and preserve it when grouping registry versions; connect existing pin mutations/persistence or implement that flow if absent. Test pin/unpin and reload. Reading a boolean alone may leave an unusable feature.

### L — substantial work (2+ days)

#### T012 — packages/api-client/test/vitest.setup.ts:101

[packages/api-client/test/vitest.setup.ts:101](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-client/test/vitest.setup.ts#L101) · TODO comment

```text
* TODO: going to disable these as a lot of our tests have warnings and errors, we can enable them globally as we
```

Enable console assertions incrementally and fix noisy mounts, missing providers, and cleanup in the affected package. Reset helpers currently disable assertions; merely deleting the comment does not enforce clean tests.

#### T034 — packages/api-reference/src/vitest.setup.ts:28

[packages/api-reference/src/vitest.setup.ts:28](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/vitest.setup.ts#L28) · TODO comment

```text
* TODO: going to disable these as a lot of our tests have warnings and errors, we can enable them globally as we
```

Enable console assertions incrementally and fix noisy mounts, missing providers, and cleanup in the affected package. Reset helpers currently disable assertions; merely deleting the comment does not enforce clean tests.

#### T015 — packages/api-reference/src/components/ApiReference.vue:526

[packages/api-reference/src/components/ApiReference.vue:526](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/components/ApiReference.vue#L526) · TODO comment

```text
// TODO: persistence should be hoisted into standalone
```

Separate persisted theme selection from the core rendering component and initialize it in standalone. Preserve controlled darkMode/forceDarkModeState behavior across embedded and standalone clients.

#### T016 — packages/api-reference/src/components/ApiReference.vue:1209

[packages/api-reference/src/components/ApiReference.vue:1209](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/components/ApiReference.vue#L1209) · TODO comment

```text
* TODO:Move this to a dedicated updateDocument function in the future and
```

Introduce an explicit document-update operation and migrate configuration-watch callers to it. Preserve document identity, source switching, selection, and async replacement behavior with regression coverage.

#### T036 — packages/api-reference/test/snapshots-cdn/snapshot.e2e.ts:40

[packages/api-reference/test/snapshots-cdn/snapshot.e2e.ts:40](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/test/snapshots-cdn/snapshot.e2e.ts#L40) · TODO comment

```text
// TODO: Get the stripe example working in V2
```

Profile the large Stripe fixture and isolate loading, traversal, and rendering bottlenecks. Restore CDN comparison with deterministic readiness after fixing the cause; increasing timeouts alone is not a completed solution.

#### T049 — packages/json-magic/src/diff/merge.test.ts:1291

[packages/json-magic/src/diff/merge.test.ts:1291](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/json-magic/src/diff/merge.test.ts#L1291) · TODO comment

```text
// TODO: a delete that is subsumed by a delete on the other side is discarded before we know
```

Retain subsumed deletes until the covering delete is known to survive conflict resolution. Update the existing regression to assert preserved deletion and cover both merge directions and each conflict choice; this is data-integrity logic.

#### T050 — packages/mock-server/src/utils/validate-request.ts:306

[packages/mock-server/src/utils/validate-request.ts:306](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/mock-server/src/utils/validate-request.ts#L306) · TODO comment

```text
* TODO: Parity follow-ups, intentionally deferred — response validation, non-JSON body validation,
```

Split response validation, non-JSON request validation, and proxy validation mode into separate features. Reuse compiled validators while defining body buffering, streaming, MIME handling, and error contracts for each.

#### T051 — packages/nextjs-openapi/src/openapi.ts:30

[packages/nextjs-openapi/src/openapi.ts:30](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/nextjs-openapi/src/openapi.ts#L30) · TODO comment

```text
// TODO switch to watcher
```

Use an incremental compiler/watch lifecycle with cache invalidation for changed, added, and removed route/type files; close watchers on shutdown and document usage. The second comment also asks for docs and caching: docs can be split out, but the full task is large.

#### T052 — packages/nextjs-openapi/src/openapi.ts:64

[packages/nextjs-openapi/src/openapi.ts:64](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/nextjs-openapi/src/openapi.ts#L64) · TODO comment

```text
* TODO:
```

Use an incremental compiler/watch lifecycle with cache invalidation for changed, added, and removed route/type files; close watchers on shutdown and document usage. The second comment also asks for docs and caching: docs can be split out, but the full task is large.

#### T058 — packages/openapi-parser/src/utils/load/load.ts:134

[packages/openapi-parser/src/utils/load/load.ts:134](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-parser/src/utils/load/load.ts#L134) · TODO comment

```text
// TODO: This leads to problems, if there are multiple references with the same file name but in different folders
```

Key loaded documents by normalized full location relative to the referring document instead of a basename-like reference identity. Preserve reference rewriting and deduplication; cover sibling directories with identical filenames and cycles.

#### T059 — packages/openapi-parser/src/utils/resolve-references.ts:11

[packages/openapi-parser/src/utils/resolve-references.ts:11](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-parser/src/utils/resolve-references.ts#L11) · TODO comment

```text
// TODO: Add support for all pointer words
```

Separate reference, base-URI, anchor, dynamic-anchor, and dialect handling. Implement resolution scope semantics with fixtures for each supported keyword; adding every listed word to a set is insufficient.

#### T062 — packages/openapi-parser/tests/openapi3-examples/3.0/pass/cyclical.test.ts:52

[packages/openapi-parser/tests/openapi3-examples/3.0/pass/cyclical.test.ts:52](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-parser/tests/openapi3-examples/3.0/pass/cyclical.test.ts#L52) · Disabled test marker

```text
it.todo('resolves circular dependencies in referenced files', async () => {
```

Resolve cross-file/ancestor cycles using a cache keyed by canonical document plus pointer and explicit visited/in-progress handling. Complete the empty ancestor cases and assert reference identity/termination, not just a defined result.

#### T063 — packages/openapi-parser/tests/references/ancestor/ancestor.test.ts:9

[packages/openapi-parser/tests/references/ancestor/ancestor.test.ts:9](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-parser/tests/references/ancestor/ancestor.test.ts#L9) · Disabled test marker

```text
describe.todo('ancestor', () => {
```

Resolve cross-file/ancestor cycles using a cache keyed by canonical document plus pointer and explicit visited/in-progress handling. Complete the empty ancestor cases and assert reference identity/termination, not just a defined result.

#### T066 — packages/openapi-to-markdown/src/components/MarkdownReference.vue:348

[packages/openapi-to-markdown/src/components/MarkdownReference.vue:348](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-to-markdown/src/components/MarkdownReference.vue#L348) · TODO comment

```text
<!-- TODO: We need way more context to generate proper request examples -->
```

Build complete operation context (server, path, parameters, security, body and MIME type) and reuse request-example/HAR generation for Markdown. Model webhooks as incoming payloads instead of inventing a server URL. Cover both commented sections with rendered Markdown fixtures.

#### T067 — packages/openapi-to-markdown/src/components/MarkdownReference.vue:537

[packages/openapi-to-markdown/src/components/MarkdownReference.vue:537](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-to-markdown/src/components/MarkdownReference.vue#L537) · TODO comment

```text
<!-- TODO: We need way more context to generate proper request examples -->
```

Build complete operation context (server, path, parameters, security, body and MIME type) and reuse request-example/HAR generation for Markdown. Model webhooks as incoming payloads instead of inventing a server URL. Cover both commented sections with rendered Markdown fixtures.

#### T089 — packages/snippetz/src/plugins/java/asynchttp/asynchttp.ts:14

[packages/snippetz/src/plugins/java/asynchttp/asynchttp.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/snippetz/src/plugins/java/asynchttp/asynchttp.ts#L14) · TODO comment

```text
// TODO: Write an own converter
```

Replace this plugin's http-snippet-lite converter with a native HAR converter, preserving URL/query escaping, headers, cookies, auth, JSON, form and multipart behavior. Use its existing fixtures and target-language checks; estimate 2–5 days per converter, not for all ten together.

#### T090 — packages/snippetz/src/plugins/java/nethttp/nethttp.ts:14

[packages/snippetz/src/plugins/java/nethttp/nethttp.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/snippetz/src/plugins/java/nethttp/nethttp.ts#L14) · TODO comment

```text
// TODO: Write an own converter
```

Replace this plugin's http-snippet-lite converter with a native HAR converter, preserving URL/query escaping, headers, cookies, auth, JSON, form and multipart behavior. Use its existing fixtures and target-language checks; estimate 2–5 days per converter, not for all ten together.

#### T091 — packages/snippetz/src/plugins/java/okhttp/okhttp.ts:14

[packages/snippetz/src/plugins/java/okhttp/okhttp.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/snippetz/src/plugins/java/okhttp/okhttp.ts#L14) · TODO comment

```text
// TODO: Write an own converter
```

Replace this plugin's http-snippet-lite converter with a native HAR converter, preserving URL/query escaping, headers, cookies, auth, JSON, form and multipart behavior. Use its existing fixtures and target-language checks; estimate 2–5 days per converter, not for all ten together.

#### T092 — packages/snippetz/src/plugins/java/unirest/unirest.ts:14

[packages/snippetz/src/plugins/java/unirest/unirest.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/snippetz/src/plugins/java/unirest/unirest.ts#L14) · TODO comment

```text
// TODO: Write an own converter
```

Replace this plugin's http-snippet-lite converter with a native HAR converter, preserving URL/query escaping, headers, cookies, auth, JSON, form and multipart behavior. Use its existing fixtures and target-language checks; estimate 2–5 days per converter, not for all ten together.

#### T093 — packages/snippetz/src/plugins/js/jquery/jquery.ts:14

[packages/snippetz/src/plugins/js/jquery/jquery.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/snippetz/src/plugins/js/jquery/jquery.ts#L14) · TODO comment

```text
// TODO: Write an own converter
```

Replace this plugin's http-snippet-lite converter with a native HAR converter, preserving URL/query escaping, headers, cookies, auth, JSON, form and multipart behavior. Use its existing fixtures and target-language checks; estimate 2–5 days per converter, not for all ten together.

#### T094 — packages/snippetz/src/plugins/js/xhr/xhr.ts:14

[packages/snippetz/src/plugins/js/xhr/xhr.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/snippetz/src/plugins/js/xhr/xhr.ts#L14) · TODO comment

```text
// TODO: Write an own converter
```

Replace this plugin's http-snippet-lite converter with a native HAR converter, preserving URL/query escaping, headers, cookies, auth, JSON, form and multipart behavior. Use its existing fixtures and target-language checks; estimate 2–5 days per converter, not for all ten together.

#### T095 — packages/snippetz/src/plugins/ocaml/cohttp/cohttp.ts:14

[packages/snippetz/src/plugins/ocaml/cohttp/cohttp.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/snippetz/src/plugins/ocaml/cohttp/cohttp.ts#L14) · TODO comment

```text
// TODO: Write an own converter
```

Replace this plugin's http-snippet-lite converter with a native HAR converter, preserving URL/query escaping, headers, cookies, auth, JSON, form and multipart behavior. Use its existing fixtures and target-language checks; estimate 2–5 days per converter, not for all ten together.

#### T096 — packages/snippetz/src/plugins/powershell/restmethod/restmethod.ts:14

[packages/snippetz/src/plugins/powershell/restmethod/restmethod.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/snippetz/src/plugins/powershell/restmethod/restmethod.ts#L14) · TODO comment

```text
// TODO: Write an own converter
```

Replace this plugin's http-snippet-lite converter with a native HAR converter, preserving URL/query escaping, headers, cookies, auth, JSON, form and multipart behavior. Use its existing fixtures and target-language checks; estimate 2–5 days per converter, not for all ten together.

#### T097 — packages/snippetz/src/plugins/powershell/webrequest/webrequest.ts:14

[packages/snippetz/src/plugins/powershell/webrequest/webrequest.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/snippetz/src/plugins/powershell/webrequest/webrequest.ts#L14) · TODO comment

```text
// TODO: Write an own converter
```

Replace this plugin's http-snippet-lite converter with a native HAR converter, preserving URL/query escaping, headers, cookies, auth, JSON, form and multipart behavior. Use its existing fixtures and target-language checks; estimate 2–5 days per converter, not for all ten together.

#### T098 — packages/snippetz/src/plugins/shell/httpie/httpie.ts:14

[packages/snippetz/src/plugins/shell/httpie/httpie.ts:14](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/snippetz/src/plugins/shell/httpie/httpie.ts#L14) · TODO comment

```text
// TODO: Write an own converter
```

Replace this plugin's http-snippet-lite converter with a native HAR converter, preserving URL/query escaping, headers, cookies, auth, JSON, form and multipart behavior. Use its existing fixtures and target-language checks; estimate 2–5 days per converter, not for all ten together.

#### T101 — packages/ts-to-openapi/src/node.ts:145

[packages/ts-to-openapi/src/node.ts:145](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/node.ts#L145) · Output/test placeholder

```text
description: 'TODO: This is an unknown type',
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T114 — packages/ts-to-openapi/src/type-nodes.test.ts:18

[packages/ts-to-openapi/src/type-nodes.test.ts:18](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L18) · TODO comment

```text
// TODO: these need to be added still, left the unknown types to have the tests passing
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T115 — packages/ts-to-openapi/src/type-nodes.test.ts:23

[packages/ts-to-openapi/src/type-nodes.test.ts:23](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L23) · Output/test placeholder

```text
description: 'TODO this type is not handled yet: UndefinedKeyword',
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T116 — packages/ts-to-openapi/src/type-nodes.test.ts:29

[packages/ts-to-openapi/src/type-nodes.test.ts:29](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L29) · Output/test placeholder

```text
description: 'TODO this type is not handled yet: TypeQuery',
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T117 — packages/ts-to-openapi/src/type-nodes.test.ts:32

[packages/ts-to-openapi/src/type-nodes.test.ts:32](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L32) · TODO comment

```text
// TODO: END unknowns
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T118 — packages/ts-to-openapi/src/type-nodes.test.ts:203

[packages/ts-to-openapi/src/type-nodes.test.ts:203](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L203) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T119 — packages/ts-to-openapi/src/type-nodes.test.ts:207

[packages/ts-to-openapi/src/type-nodes.test.ts:207](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L207) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T120 — packages/ts-to-openapi/src/type-nodes.test.ts:211

[packages/ts-to-openapi/src/type-nodes.test.ts:211](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L211) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T121 — packages/ts-to-openapi/src/type-nodes.test.ts:215

[packages/ts-to-openapi/src/type-nodes.test.ts:215](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L215) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T122 — packages/ts-to-openapi/src/type-nodes.test.ts:219

[packages/ts-to-openapi/src/type-nodes.test.ts:219](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L219) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T123 — packages/ts-to-openapi/src/type-nodes.test.ts:223

[packages/ts-to-openapi/src/type-nodes.test.ts:223](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L223) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T124 — packages/ts-to-openapi/src/type-nodes.test.ts:227

[packages/ts-to-openapi/src/type-nodes.test.ts:227](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L227) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T125 — packages/ts-to-openapi/src/type-nodes.test.ts:231

[packages/ts-to-openapi/src/type-nodes.test.ts:231](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L231) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T126 — packages/ts-to-openapi/src/type-nodes.test.ts:235

[packages/ts-to-openapi/src/type-nodes.test.ts:235](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L235) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T127 — packages/ts-to-openapi/src/type-nodes.test.ts:239

[packages/ts-to-openapi/src/type-nodes.test.ts:239](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L239) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T128 — packages/ts-to-openapi/src/type-nodes.test.ts:243

[packages/ts-to-openapi/src/type-nodes.test.ts:243](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L243) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T129 — packages/ts-to-openapi/src/type-nodes.test.ts:247

[packages/ts-to-openapi/src/type-nodes.test.ts:247](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L247) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T130 — packages/ts-to-openapi/src/type-nodes.test.ts:251

[packages/ts-to-openapi/src/type-nodes.test.ts:251](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L251) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TypeReference"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T131 — packages/ts-to-openapi/src/type-nodes.test.ts:257

[packages/ts-to-openapi/src/type-nodes.test.ts:257](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L257) · Commented output placeholder

```text
//     "description": "TODO this type is not handled yet: IndexSignature"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T132 — packages/ts-to-openapi/src/type-nodes.test.ts:264

[packages/ts-to-openapi/src/type-nodes.test.ts:264](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L264) · Commented output placeholder

```text
//     "description": "TODO this type is not handled yet: IndexSignature"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T133 — packages/ts-to-openapi/src/type-nodes.test.ts:271

[packages/ts-to-openapi/src/type-nodes.test.ts:271](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L271) · Commented output placeholder

```text
//     "description": "TODO this type is not handled yet: IndexSignature"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T134 — packages/ts-to-openapi/src/type-nodes.test.ts:287

[packages/ts-to-openapi/src/type-nodes.test.ts:287](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L287) · Commented output placeholder

```text
//   "description": "TODO this type is not handled yet: TupleType"
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T135 — packages/ts-to-openapi/src/type-nodes.test.ts:380

[packages/ts-to-openapi/src/type-nodes.test.ts:380](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.test.ts#L380) · Output/test placeholder

```text
description: 'TODO this type is not handled yet: NeverKeyword',
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T137 — packages/ts-to-openapi/src/type-nodes.ts:146

[packages/ts-to-openapi/src/type-nodes.ts:146](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.ts#L146) · Commented output placeholder

```text
//     description: `TODO this type is not handled yet: ${SyntaxKind[member.kind]}`,
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T138 — packages/ts-to-openapi/src/type-nodes.ts:152

[packages/ts-to-openapi/src/type-nodes.ts:152](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.ts#L152) · Output/test placeholder

```text
description: `TODO this type is not handled yet: ${SyntaxKind[member.kind]}`,
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T139 — packages/ts-to-openapi/src/type-nodes.ts:263

[packages/ts-to-openapi/src/type-nodes.ts:263](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.ts#L263) · Output/test placeholder

```text
description: `TODO this type is not handled yet: ${SyntaxKind[typeNode.kind]}`,
```

Treat unsupported-type strings and commented expectations as part of the type-generation backlog. Add explicit handling per TypeScript syntax kind using the checker, then replace each matching placeholder expectation. Define representability for undefined/never, utility and reference types, index signatures and tuples; do not replace the TODO string while leaving an incorrect schema.

#### T112 — packages/ts-to-openapi/src/responses.ts:83

[packages/ts-to-openapi/src/responses.ts:83](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/responses.ts#L83) · TODO comment

```text
* TODO:
```

Separate Next-specific response detection from generic extraction; support non-JSON payloads, extract JSDoc descriptions, and introduce a response predicate/adapter. Test MIME types and call forms; the description-only subset is medium.

#### T136 — packages/ts-to-openapi/src/type-nodes.ts:27

[packages/ts-to-openapi/src/type-nodes.ts:27](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/ts-to-openapi/src/type-nodes.ts#L27) · TODO comment

```text
* TODO:
```

Split null/nullable handling, required/optional properties, initializer defaults, and JSDoc into focused changes with version-aware schema output. Validate each against type-node fixtures before removing the umbrella TODO.

#### T143 — packages/workspace-store/src/client.test.ts:563

[packages/workspace-store/src/client.test.ts:563](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L563) · TODO comment

```text
// TODO: handle server side preprocessed documents (nested refs)
```

Handle nested resolved refs and cycles consistently across magic proxies and remotely preprocessed chunks. Track resolution identity and prevent recursive refetch loops, then enable the existing skipped/todo regressions.

#### T156 — packages/workspace-store/src/helpers/get-resolved-ref.test.ts:7

[packages/workspace-store/src/helpers/get-resolved-ref.test.ts:7](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/helpers/get-resolved-ref.test.ts#L7) · Disabled test marker

```text
describe.todo('multiple ref depth', () => {
```

Handle nested resolved refs and cycles consistently across magic proxies and remotely preprocessed chunks. Track resolution identity and prevent recursive refetch loops, then enable the existing skipped/todo regressions.

### Decision or dependency first — estimate after resolving scope

#### T014 — packages/api-reference/src/components/ApiReference.vue:178

[packages/api-reference/src/components/ApiReference.vue:178](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/components/ApiReference.vue#L178) · TODO comment

```text
* TODO remove this once the bug is fixed
```

Confirm the installed Headless UI version no longer needs provideUseId using an SSR-to-hydration regression. Remove the workaround only after that succeeds; upstream issue status was not checked in this audit.

#### T031 — packages/api-reference/src/index.ts:8

[packages/api-reference/src/index.ts:8](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/index.ts#L8) · TODO comment

```text
// TODO: Ideally, we'd remove those exports or at least not export them through the root index.
```

Inventory public consumers, introduce supported subpath exports or deprecations, and migrate callers before removing root exports. Treat as compatibility work, not an easy deletion.

#### T044 — packages/helpers/src/array/sort-by-order.test.ts:109

[packages/helpers/src/array/sort-by-order.test.ts:109](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/helpers/src/array/sort-by-order.test.ts#L109) · TODO comment

```text
// TODO: might change this behavior in the future?
```

Decide whether sortByOrder intentionally deduplicates or preserves duplicate input values. Keep the existing expectation unless changing the documented contract; if preserving duplicates, change grouping/ordering and test repeated keys.

#### T045 — packages/helpers/src/node/path.ts:209

[packages/helpers/src/node/path.ts:209](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/helpers/src/node/path.ts#L209) · TODO comment

```text
// TODO: make this comparison case-insensitive on windows?
```

Establish whether this browser path helper promises POSIX, Windows, or Node-compatible suffix behavior. Add case-sensitive suffix examples first; do not introduce case folding just because a path is on Windows.

#### T046 — packages/helpers/src/object/object-replace.ts:1

[packages/helpers/src/object/object-replace.ts:1](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/helpers/src/object/object-replace.ts#L1) · TODO comment

```text
// TODO: This is a copy of org/packages/helpers/src/objects/merge.ts
```

Compare the referenced org repository implementation if available, choose the canonical package, and migrate its callers. This checkout cannot establish cross-repository duplication is resolved; the local replace behavior is not generic deep merge.

#### T048 — packages/import/playground/index.ts:1

[packages/import/playground/index.ts:1](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/import/playground/index.ts#L1) · TODO comment

```text
// TODO
```

The playground contains only a log and a bare TODO. Define a minimal import demo (input format and visible output) before implementing it, or explicitly retire the unused playground after checking consumers.

#### T056 — packages/openapi-parser/src/types/index.ts:9

[packages/openapi-parser/src/types/index.ts:9](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-parser/src/types/index.ts#L9) · TODO comment

```text
// TODO: I'd expect merge to overwrite the other way around (overwrite A, keep B)
```

Document which side wins overlapping keys in Merge and add type-level cases. Reverse precedence only after auditing all consumers; the current A & Omit<B, keyof A> deliberately keeps A.

#### T061 — packages/openapi-parser/src/utils/upgrade.ts:30

[packages/openapi-parser/src/utils/upgrade.ts:30](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/openapi-parser/src/utils/upgrade.ts#L30) · TODO comment

```text
// TODO: Make dynamic
```

The current upgrader explicitly targets 3.1 and returns an OpenApiDocumentV3_1 result, so the fixed version is internally consistent. Either document that contract and retire the vague note, or design a target-version option with matching result types.

#### T155 — packages/workspace-store/src/client.ts:1459

[packages/workspace-store/src/client.ts:1459](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.ts#L1459) · TODO comment

```text
// TODO: Implement commit logic
```

Define commitDocument semantics: destination, dirty-state reset, base snapshot, error handling and registry interaction. Implement only after identifying the commit owner; a console.warn stub does not specify a safe commit contract.

#### T161 — projects/scalar-app/src/style.css:26

[projects/scalar-app/src/style.css:26](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/projects/scalar-app/src/style.css#L26) · TODO comment

```text
/* TODO: Remove this once we update the reset */
```

Verify the installed reset and rendered link appearance before deleting the override. Remove only if the reset now preserves the desired decoration; compare links across the app, including Markdown.

## Non-task matches excluded from complexity estimates

| Source                                                                                                                                                                                                                   | Matching text                                                                                                                                                                                                                                                           | Reason                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [.agents/skills/typescript/SKILL.md:113](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/.agents/skills/typescript/SKILL.md#L113)                                                         | \* If the type is temporary or will change later, leave a TODO comment.                                                                                                                                                                                                 | Instruction or illustrative skill example           |
| [.agents/skills/typescript/SKILL.md:119](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/.agents/skills/typescript/SKILL.md#L119)                                                         | \* TODO: Replace with dynamic permissions from backend when available.                                                                                                                                                                                                  | Instruction or illustrative skill example           |
| [AGENTS.md:192](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/AGENTS.md#L192)                                                                                                           | - Leave TODO comments for temporary solutions                                                                                                                                                                                                                           | Instruction or illustrative skill example           |
| [packages/api-reference/src/features/localization/locales/es.ts:13](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/features/localization/locales/es.ts#L13)   | httpMethod: 'Método HTTP',                                                                                                                                                                                                                                              | Translation, not a task marker                      |
| [packages/api-reference/src/features/localization/locales/es.ts:172](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/features/localization/locales/es.ts#L172) | expandAll: 'Expandir todo {label}',                                                                                                                                                                                                                                     | Translation, not a task marker                      |
| [packages/api-reference/src/features/localization/locales/es.ts:233](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/features/localization/locales/es.ts#L233) | allOf: 'todo lo siguiente:',                                                                                                                                                                                                                                            | Translation, not a task marker                      |
| [packages/api-reference/src/features/localization/locales/pt.ts:13](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/api-reference/src/features/localization/locales/pt.ts#L13)   | httpMethod: 'Método HTTP',                                                                                                                                                                                                                                              | Translation, not a task marker                      |
| [packages/highlight/src/langs/kotlin.ts:125](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/highlight/src/langs/kotlin.ts#L125)                                                 | '\\b(?:print(?:ln)?&#124;readLine&#124;arrayOf&#124;(?:mutableL&#124;l)istOf&#124;(?:mutableM&#124;m)apOf&#124;(?:mutableS&#124;s)etOf&#124;emptyList&#124;buildString&#124;require&#124;check&#124;error&#124;TODO&#124;repeat&#124;lazy&#124;with)\\b(?=\\s\*[({<])', | Kotlin function name in syntax-highlighting grammar |
| [packages/workspace-store/src/client.test.ts:662](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L662)                                       | title: 'Todo API',                                                                                                                                                                                                                                                      | Todo API/schema fixture name                        |
| [packages/workspace-store/src/client.test.ts:677](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L677)                                       | $ref: '#/components/schemas/Todo',                                                                                                                                                                                                                                      | Todo API/schema fixture name                        |
| [packages/workspace-store/src/client.test.ts:689](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L689)                                       | Todo: {                                                                                                                                                                                                                                                                 | Todo API/schema fixture name                        |
| [packages/workspace-store/src/client.test.ts:707](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L707)                                       | 'Todo': {                                                                                                                                                                                                                                                               | Todo API/schema fixture name                        |
| [packages/workspace-store/src/client.test.ts:724](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L724)                                       | 'title': 'Todo API',                                                                                                                                                                                                                                                    | Todo API/schema fixture name                        |
| [packages/workspace-store/src/client.test.ts:737](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L737)                                       | '$ref': '#/components/schemas/Todo',                                                                                                                                                                                                                                    | Todo API/schema fixture name                        |
| [packages/workspace-store/src/client.test.ts:769](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L769)                                       | title: 'Todo API',                                                                                                                                                                                                                                                      | Todo API/schema fixture name                        |
| [packages/workspace-store/src/client.test.ts:788](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L788)                                       | 'id': 'default/models/Todo',                                                                                                                                                                                                                                            | Todo API/schema fixture name                        |
| [packages/workspace-store/src/client.test.ts:789](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L789)                                       | 'name': 'Todo',                                                                                                                                                                                                                                                         | Todo API/schema fixture name                        |
| [packages/workspace-store/src/client.test.ts:790](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L790)                                       | 'title': 'Todo',                                                                                                                                                                                                                                                        | Todo API/schema fixture name                        |
| [packages/workspace-store/src/client.test.ts:791](https://github.com/scalar/scalar/blob/29ed74f9b463ec4f63b62c0bf6943f5db1b5d08a/packages/workspace-store/src/client.test.ts#L791)                                       | ref: '#/components/schemas/Todo',                                                                                                                                                                                                                                       | Todo API/schema fixture name                        |

`CLAUDE.md` is a symlink to `AGENTS.md`; its instruction match is counted only through AGENTS.md. Locale-dependent search boundaries can match the final letters of “Método”; these broad-search matches are deliberately excluded as translations.

## Original audit validation and follow-through

At the time of the original audit, this branch added only this Markdown report. Source TODOs and runtime code were unchanged at that point; the implementation follow-up above records the subsequent changes. Inventory coverage was checked programmatically: every broad-scan occurrence is classified or explicitly excluded, and all source line references match the audited checkout. No runtime tests or package type checks were needed for this report, and none were run. The report was formatted independently because the repository currently ignores Markdown in Prettier (T003).

For a follow-up implementation, keep each behavioral change scoped, use the relevant package tests, lint/format touched files, and type-check affected packages. Add changesets where required. UI changes need playground screenshots. Removing a TODO is complete only when its underlying work is done or the note is shown to be obsolete; do not delete disabled tests or placeholders simply to reduce the count.
