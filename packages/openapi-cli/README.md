# @scalar/openapi-cli

OpenAPI-driven CLI in a **Stripe-style** pattern: verb + path or resource + action subcommands, with **agent-ready** behavior (structured output, non-interactive, headless auth).

## Playground

Try the CLI interactively with any OpenAPI spec:

```bash
pnpm build
pnpm playground
# optional: pnpm playground path/to/your/openapi.yaml
```

The playground loads the spec, prints a short summary and example snippets, then lets you run commands (e.g. `get /planets` or `planets getAllData --limit=2`). See [playground/README.md](./playground/README.md) for details.

## Usage

Require a spec via `-s` / `--spec` (file path or URL), then use either **generic verb commands** or **resource + action** subcommands.

### Verb + path (generic)

```bash
openapi-cli -s openapi.yaml get /planets
openapi-cli -s openapi.yaml get /planets -q limit=10 -q offset=0
openapi-cli -s openapi.yaml post /planets -d '{"name":"Earth"}'
openapi-cli -s openapi.yaml post /planets -d @body.json
openapi-cli -s openapi.yaml post /planets -d -   # body from stdin
```

### Resource + action (from OpenAPI)

Operations are exposed as `[version] [namespace] <resource> <action>` when the spec has path segments and operationIds:

```bash
openapi-cli -s openapi.yaml planets getAllData --limit=10
openapi-cli -s openapi.yaml planets createPlanet --name=Earth
openapi-cli -s openapi.yaml v2 core accounts create --contact-email=user@example.com --identity.country=us
```

Nested body properties use **dotted flags** (e.g. `--identity.country=us`). Path params are flags (e.g. `--id 123`).

### Options

- **`-s, --spec <file|url>`** (required): OpenAPI spec file or URL.
- **`--base-url <url>`**: Override base URL (default from spec `servers[0]`).
- **`--api-key`, `--bearer`**: Auth (or set `API_KEY`, `BEARER_TOKEN`).
- **`-d, --data`**: Request body (JSON, `@file`, or `-` for stdin).
- **`-q, --query`**, **`-H, --header`**: Query and headers (repeatable).
- **`--output json`** / **`--json`**: Machine-readable envelope `{ status, headers, body }`.
- **`--show-headers`**: Print response headers.
- **`--yes` / `--force`**: Non-interactive (skip confirmations).
- **`--help-json`**: Print structured command/flag description (JSON) and exit.
- **`schema`** subcommand: Same as `--help-json` (for agent discoverability).

### Agent-ready behavior

- **Structured output**: Use `--json` for a single parseable envelope.
- **Non-interactive**: No prompts by default; use `--yes` / `--force` when needed.
- **Headless auth**: Env vars and flags only (no browser OAuth by default).
- **Composable**: Body from stdin (`-d -`), pipe output to `jq` or other tools.
- **Self-describing**: `openapi-cli -s <spec> schema` or `--help-json` for JSON description of commands and flags.

See [STABILITY.md](./STABILITY.md) for the documented contract for automation and agents.

## Programmatic API

```ts
import {
  loadSpec,
  buildRequest,
  traverseSpec,
  toCliSnippet,
  buildHelpSchema,
} from '@scalar/openapi-cli'
```

- **`loadSpec(input)`**: Load and dereference an OpenAPI spec from file path or URL.
- **`buildRequest(input)`**: Build `{ url, headers, body }` from method, path, params, and spec.
- **`traverseSpec(spec)`**: List all operations with resource/action and params.
- **`toCliSnippet(options)`**: Generate a copy-paste CLI command for an operation (for API reference “CLI” tab or `?lang=cli`).
- **`buildHelpSchema(spec)`**: Build the same JSON structure printed by `schema` / `--help-json`.

## CLI snippets for API reference

Use **`toCliSnippet`** to show runnable CLI examples per operation (e.g. in a “CLI” tab or `?lang=cli`):

```ts
import { toCliSnippet } from '@scalar/openapi-cli'

const cmd = toCliSnippet({
  spec: mySpec,
  method: 'GET',
  path: '/planets',
  query: { limit: '10' },
  specPath: 'openapi.yaml',
  cliName: 'myapi',
})
// e.g. "myapi -s openapi.yaml planets getAllData --limit=10"
```

The snippet prefers resource+action form when the spec has a matching operation; otherwise it uses verb+path form.
