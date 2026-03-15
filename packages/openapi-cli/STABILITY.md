# Stability contract for automation and agents

This document describes the **stable contract** for the OpenAPI CLI so that automation (CI/CD, scripts, AI agents) can rely on predictable behavior. We avoid breaking changes to the output shape and flag semantics without a clear deprecation path.

## `--output json` / `--json` envelope

When you pass `--json` or `--output json` (verb commands or resource+action commands), the CLI prints a **single JSON object** to stdout (no tables or human-only formatting):

```json
{
  "status": 200,
  "headers": { "content-type": "application/json", ... },
  "body": { ... }
}
```

- **`status`** (number): HTTP response status code.
- **`headers`** (object): Response headers as string keys and string values.
- **`body`**: Parsed JSON when the response is `application/json`; otherwise the raw response body string.

This envelope is the **machine-readable contract**. Scripts and agents should parse this single line (or object) and use `status`, `headers`, and `body` accordingly.

## Flags

- **Auth**: `--api-key`, `--bearer` (or env `API_KEY`, `BEARER_TOKEN`). Headless only; no browser-based OAuth by default.
- **Non-interactive**: `--yes` / `--force` skips any confirmation prompts. `CI=1` is respected when we add confirmations.
- **Body**: `-d` / `--data` accepts a JSON string, `@file.json` (read from file), or `-` (read from stdin) for composability.
- **Output**: Default is pretty-printed; `--json` gives the envelope above.

## Self-describing: `schema` and `--help-json`

- **`openapi-cli -s <spec> schema`** prints a JSON description of all commands and flags (verbs + resource/action operations and their options). Agents can use this to discover usage at runtime.
- **`openapi-cli -s <spec> --help-json`** prints the same JSON and exits (no subcommand needed).

## Versioning

We will not change the `--output json` envelope shape or the meaning of the flags above in a breaking way without:

1. Bumping a major version, or
2. Documenting a deprecation period and migration path.
