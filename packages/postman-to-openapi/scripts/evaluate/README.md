# Postman → OpenAPI evaluation harness

A loop for regularly checking how well `@scalar/postman-to-openapi` handles real-world Postman collections. A runner script does the conversion and records structural metrics. A coding agent (or a human) then reads those results, rates the output against [`RUBRIC.md`](./RUBRIC.md), and files improvement ideas as individual markdown files.

## Layout

Everything under `fixtures/evaluate/` is git-ignored (the package's `.gitignore` already excludes `fixtures/`):

```
packages/postman-to-openapi/
├── scripts/evaluate/
│   ├── run.ts         # runner (committed)
│   ├── README.md      # this file (committed)
│   └── RUBRIC.md      # rating criteria (committed)
└── fixtures/evaluate/
    ├── input/         # ← drop .json Postman collections here
    ├── output/        # generated OpenAPI, one file per input
    ├── reports/       # run-<timestamp>.json + report.md
    └── ideas/         # one markdown file per distinct improvement idea
```

## Running it

```bash
# 1. Drop Postman collection JSON files into fixtures/evaluate/input/
# 2. From the repo root:
pnpm --filter @scalar/postman-to-openapi evaluate
```

The runner:

- iterates every `.json` file in `fixtures/evaluate/input/`,
- calls `convert()` on each one (catching errors per-file so one bad collection does not abort the run),
- writes the resulting OpenAPI document to `fixtures/evaluate/output/<name>.json`,
- runs `@scalar/openapi-parser` `validate()` against each output,
- records structural metrics for both the input (request count, auth types, body modes, …) and the output (paths, operations, security schemes, response examples, …),
- writes a machine-readable `fixtures/evaluate/reports/run-<timestamp>.json` summarising the whole run,
- prints a compact pass/fail table to stdout.

## Agent review loop

After a run, ask the coding agent (Claude Code) to review the results:

> "Review the latest evaluate run in `packages/postman-to-openapi/fixtures/evaluate/` and update the report + ideas."

The agent then:

1. Reads the newest `fixtures/evaluate/reports/run-*.json`.
2. For each result, opens the input collection and — for successful conversions — the generated OpenAPI output, scoring it against each dimension in [`RUBRIC.md`](./RUBRIC.md) (1-5 with a short note).
3. Writes `fixtures/evaluate/reports/report.md`:
   - top-level summary table (collection × dimension scores),
   - narrative notes per collection,
   - aggregated patterns at the bottom.
4. For each distinct issue found, creates or updates `fixtures/evaluate/ideas/<kebab-slug>.md` containing:
   - problem statement,
   - evidence (which collections exhibit it, with small excerpts),
   - suggested fix direction,
   - rough effort estimate.

   If an idea file with the same root cause already exists, the agent appends new evidence to it rather than creating a duplicate.

## Adding to the input set

Postman collections often contain real URLs, tokens, or internal API details. Keep them out of git — this harness never commits anything under `fixtures/`. When sharing a finding externally, reference the redacted excerpt inside the idea file, not the raw collection.

## Re-running after converter changes

Because `run.ts` imports `convert` from `../../src/index` (not the built `dist/`), any local change to the converter is reflected on the next `evaluate` run with no rebuild required.
