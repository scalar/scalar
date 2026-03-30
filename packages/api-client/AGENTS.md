# AGENTS.md – `@scalar/api-client`

## Package Overview

`@scalar/api-client` is the API testing client. It provides request editors, response viewers, authentication forms, environment management, and collection organization. It ships in three layouts: **web**, **app**, and **modal**.

## Visual Testing

### Running the playgrounds

```bash
cd packages/api-client
pnpm dev                    # Starts the v2 web playground (default)
pnpm playground:v2:web      # Same as dev — standalone web client
pnpm playground:v2:app      # Desktop-style app layout with full workspace
pnpm playground:v2:modal    # Modal overlay layout
```

Or from the repo root with Turbo (auto-builds dependencies):

```bash
pnpm turbo --filter @scalar/api-client dev
```

### Layout differences

| Layout | Script | Description |
|--------|--------|-------------|
| **Web** | `pnpm playground:v2:web` | Standalone browser client. Default `dev` target. Single-request focused. |
| **App** | `pnpm playground:v2:app` | Full desktop-style layout with sidebar, collections, environments, and workspace management. Test here for changes to workspace features. |
| **Modal** | `pnpm playground:v2:modal` | Opens as an overlay. Also testable via the api-reference playground by clicking "Test Request" on any operation. |

### What to check

- **Address bar** — URL input, method selector, send button
- **Request editor** — body, headers, query params, path params, auth tabs
- **Response viewer** — status, headers, body with syntax highlighting
- **Sidebar** (app layout) — collection tree, request organization, drag-and-drop
- **Environments** (app layout) — variable management, environment switching
- **Auth** — various auth type forms (Bearer, Basic, API Key, OAuth)

### When to test each layout

- **Broad UI changes** (components, styling, layout) — test both **web** and **app**
- **Request/response changes** — **web** is sufficient
- **Sidebar, collections, workspace features** — test in **app**
- **Modal integration** — test via **api-reference** playground ("Test Request" button) or `playground:v2:modal`
