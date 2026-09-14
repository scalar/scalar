# Markdown evaluation

Run after installing dependencies and building upstream packages:

```sh
pnpm --filter @scalar/openapi-to-markdown evaluate
```

Corpus version `2.1.0` retains all original baseline checks and adds authentication, servers, webhook and callback content, request/response details, schema fidelity, tag metadata, references/recursion, equivalent Swagger 2.0 and OpenAPI 3.x inputs, and a 150-operation document. Complete documents and render options pass unchanged to the public renderer. External references use checked-in local files and require no network access.

Required checks protect established behavior; diagnostic checks expose missing features. Promote a diagnostic check by setting `baseline: true` after verifying its output. Every check has equal weight, including render outcome, clean output, and determinism. Scores are also broken down by feature group. A rendering exception is recorded per fixture and does not prevent subsequent fixtures from running. Expected exceptions must match their message; unexpected success fails.

Page-selector correctness, invalid-selector errors, and inclusion/exclusion contracts belong in the renderer's regular regression tests. They are not scored by this corpus. Render-option support remains available for evaluating selected-page content or rendering cost when useful.

```sh
MARKDOWN_EVALUATION_STRICT=1 pnpm --filter @scalar/openapi-to-markdown evaluate
MARKDOWN_EVALUATION_OUTPUT=/tmp/markdown-current pnpm --filter @scalar/openapi-to-markdown evaluate
MARKDOWN_EVALUATION_PREVIOUS=/tmp/markdown-current/report.json \
  MARKDOWN_EVALUATION_OUTPUT=/tmp/markdown-next \
  pnpm --filter @scalar/openapi-to-markdown evaluate
```

Reports contain per-check results, rendering errors, feature totals, and newly passing/regressed check identities when a previous report is provided. Comparisons reject different corpus versions or changed check identities. Bump `corpusVersion` whenever changing inputs, assertions, required status, or scoring semantics. Do not compare aggregate percentages across corpus versions.

Assertions can select a path of exact Markdown headings. Each heading must identify one section within its parent; missing or ambiguous headings fail even negative checks. Peer sections are excluded, and headings inside fenced code are ignored. Regex checks support `absent`, exact occurrence `count`, and `excludeExamples` to keep schema assertions from matching generated JSON; JSON checks parse the selected fenced example and compare complete values, including types and extra properties. The optional `example` index selects a later JSON block.

Per-fixture `durationMs` and `heapDeltaBytes` cover both sequential renders used for determinism; `outputBytes` is the UTF-8 size of the first output. Heap deltas can be negative due to garbage collection and are not peak memory. These measurements are diagnostic, with no timing or memory thresholds. They provide an initial comparison point for a future prepare-once/render-many API, not a controlled benchmark.

This corpus measures concrete output requirements, not overall OpenAPI compliance or LLM quality. Inspect rendered Markdown alongside scores. Unsupported features remain visible without changing production rendering behavior.
