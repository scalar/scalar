# AGENTS.md – `@scalar/api-reference`

## Package Overview

`@scalar/api-reference` renders beautiful API documentation from OpenAPI descriptions. It is the primary visual surface for themes, sidebar navigation, search, code highlighting, and the embedded API client modal.

## Visual Testing

### Running the playground

```bash
cd packages/api-reference
pnpm dev
```

Or from the repo root with Turbo (auto-builds dependencies):

```bash
pnpm turbo --filter @scalar/api-reference dev
```

The default playground loads the **Galaxy** OpenAPI spec and renders the full reference UI including sidebar, search, and the embedded API client.

### What to check

- **Sidebar** — navigation tree, section grouping, active state highlighting
- **Content area** — operation details, parameters, request/response schemas
- **Search** — open with `Cmd/Ctrl+K`, verify results and navigation
- **Test Request** — click "Test Request" on any operation to open the API client modal
- **Theme** — toggle between light and dark modes if applicable
- **Code samples** — language tabs, syntax highlighting, copy behavior
