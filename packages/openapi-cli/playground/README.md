# OpenAPI CLI Playground

Try the CLI against any OpenAPI spec: load a document, see the generated commands and snippets, then run commands interactively.

## Run

From the repo root:

```bash
pnpm --filter @scalar/openapi-cli build
pnpm --filter @scalar/openapi-cli playground
```

Or from `packages/openapi-cli`:

```bash
pnpm build
pnpm playground
```

By default the playground uses the Galaxy spec (`packages/galaxy/src/documents/3.1.yaml`). To use another file or URL:

```bash
pnpm playground path/to/your/openapi.yaml
pnpm playground https://example.com/openapi.json
```

## Usage

1. **Start** – The playground loads the spec and prints a short summary (verbs, number of operations, example snippets).
2. **Enter commands** – Type a CLI command without the binary or `-s <spec>` (the playground adds those for you), e.g.:
   - `get /planets`
   - `get /planets -q limit=2`
   - `planets getAllData --limit=2`
   - `planets createPlanet --name=Earth`
3. **Exit** – Type `exit` or press Ctrl+D.

Each command is run with the real CLI, so you see the same output as when running `openapi-cli -s <spec> <your-command>` in the terminal.
